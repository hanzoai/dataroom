import { NextRequest, NextResponse } from "next/server";

import { waitUntil } from "@vercel/functions";

import { processDocument } from "@/lib/api/documents/process-document";
import { verifyDataroomSession } from "@/lib/auth/dataroom-auth";
import { DocumentData } from "@/lib/documents/create-document";
import prisma from "@/lib/prisma";
import { sendDataroomUploadNotificationTask } from "@/lib/trigger/dataroom-upload-notification";
import { supportsAdvancedExcelMode } from "@/lib/utils/get-content-type";
import { sanitizePlainText } from "@/lib/utils/sanitize-html";

/**
 * Visitor uploads into a data room, from the viewer surface.
 *
 * Authorisation is the dataroom session cookie plus the link's own
 * `enableUpload` switch — there is no logged-in team user on this path, so
 * every read and write below is scoped by the (link, dataroom, viewer) triple
 * the session proves.
 */

/** Rendered file types only become viewable once the pipeline has paged them. */
const NEEDS_RENDERING = new Set(["pdf", "docs", "slides"]);

/** Debounce window for the "someone uploaded" email to the team. */
const NOTIFICATION_DELAY_MS = 5 * 60 * 1000;

type Session = { viewerId: string; viewId: string };

/** Resolve the dataroom session, or the response to send instead. */
async function authorize(
  request: NextRequest,
  linkId: string,
  dataroomId: string | null,
): Promise<{ session: Session; dataroomId: string } | NextResponse> {
  if (!linkId || !dataroomId) {
    return NextResponse.json(
      { message: "Missing required parameters" },
      { status: 400 },
    );
  }

  const session = await verifyDataroomSession(request, linkId, dataroomId);
  if (!session?.viewerId) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  return {
    session: { viewerId: session.viewerId, viewId: session.viewId },
    dataroomId,
  };
}

/** GET — the uploads this viewer has already made through this link. */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  const auth = await authorize(
    request,
    params.id,
    request.nextUrl.searchParams.get("dataroomId"),
  );
  if (auth instanceof NextResponse) return auth;

  try {
    const uploads = await prisma.documentUpload.findMany({
      where: {
        viewerId: auth.session.viewerId,
        dataroomId: auth.dataroomId,
        linkId: params.id,
      },
      select: {
        id: true,
        documentId: true,
        dataroomDocumentId: true,
        originalFilename: true,
        uploadedAt: true,
        document: {
          select: {
            name: true,
            type: true,
            versions: {
              where: { isPrimary: true },
              select: { id: true, hasPages: true },
              take: 1,
            },
          },
        },
        dataroomDocument: { select: { folderId: true } },
      },
      orderBy: { uploadedAt: "desc" },
    });

    return NextResponse.json({
      uploads: uploads.map((upload) => {
        const version = upload.document?.versions[0];
        const fileType = upload.document?.type ?? "";
        return {
          id: upload.id,
          documentId: upload.documentId,
          dataroomDocumentId: upload.dataroomDocumentId,
          documentVersionId: version?.id ?? null,
          name: upload.originalFilename ?? upload.document?.name ?? "Unknown",
          fileType,
          folderId: upload.dataroomDocument?.folderId ?? null,
          uploadedAt: upload.uploadedAt,
          status:
            !NEEDS_RENDERING.has(fileType) || version?.hasPages
              ? "complete"
              : "processing",
        };
      }),
    });
  } catch (error) {
    console.error("Error fetching viewer uploads:", error);
    return NextResponse.json(
      { message: "Error fetching uploads" },
      { status: 500 },
    );
  }
}

/** POST — record a file the viewer just pushed to storage. */
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  const linkId = params.id;
  const { documentData, dataroomId, folderId } = (await request.json()) as {
    documentData?: DocumentData;
    dataroomId?: string;
    folderId?: string;
  };

  const auth = await authorize(request, linkId, dataroomId ?? null);
  if (auth instanceof NextResponse) return auth;
  if (!documentData) {
    return NextResponse.json(
      { message: "Missing required parameters" },
      { status: 400 },
    );
  }

  try {
    const link = await prisma.link.findUnique({
      where: { id: linkId, dataroomId: auth.dataroomId },
      select: {
        enableUpload: true,
        enableNotification: true,
        uploadFolderId: true,
        teamId: true,
        team: { select: { plan: true, enableExcelAdvancedMode: true } },
      },
    });

    if (!link?.enableUpload || !link.teamId) {
      return NextResponse.json(
        { message: "Uploads not allowed for this link" },
        { status: 403 },
      );
    }

    // The session proves a viewer id; confirm it still belongs to this team.
    const viewer = await prisma.viewer.findUnique({
      where: {
        id: auth.session.viewerId,
        teamId: link.teamId,
        views: { some: { id: auth.session.viewId } },
      },
      select: { id: true },
    });
    if (!viewer) {
      return NextResponse.json({ message: "Viewer not found" }, { status: 404 });
    }

    const name = sanitizePlainText(String(documentData.name ?? ""));
    if (!name || name.length > 255) {
      return NextResponse.json(
        { message: "Document name is required" },
        { status: 400 },
      );
    }

    // Uploads land in the link's designated folder when it has one, otherwise
    // wherever the viewer was browsing.
    const uploadFolder = link.uploadFolderId
      ? await prisma.dataroomFolder.findUnique({
          where: { id: link.uploadFolderId, dataroomId: auth.dataroomId },
          select: { id: true },
        })
      : null;
    const targetFolderId = uploadFolder?.id ?? folderId ?? null;

    const document = await processDocument({
      documentData: {
        ...documentData,
        name,
        enableExcelAdvancedMode:
          documentData.supportedFileType === "sheet" &&
          !!link.team?.enableExcelAdvancedMode &&
          supportsAdvancedExcelMode(documentData.contentType),
      },
      teamId: link.teamId,
      teamPlan: link.team?.plan ?? "free",
      isExternalUpload: true,
    });

    const dataroomDocument = await prisma.dataroomDocument.create({
      data: {
        dataroomId: auth.dataroomId,
        documentId: document.id,
        folderId: targetFolderId,
      },
    });

    await prisma.documentUpload.create({
      data: {
        documentId: document.id,
        viewerId: auth.session.viewerId,
        viewId: auth.session.viewId,
        linkId,
        originalFilename: document.name,
        fileSize: documentData.fileSize ?? 0,
        numPages: document.numPages,
        mimeType: document.contentType,
        dataroomId: auth.dataroomId,
        dataroomDocumentId: dataroomDocument.id,
        teamId: link.teamId,
      },
    });

    if (link.enableNotification) {
      // One delayed notification per viewer per link: the idempotency key is
      // the batch, so a burst of uploads collapses into a single email and we
      // never have to hunt down and cancel already-scheduled runs.
      waitUntil(
        sendDataroomUploadNotificationTask
          .trigger(
            {
              dataroomId: auth.dataroomId,
              linkId,
              viewerId: auth.session.viewerId,
              teamId: link.teamId,
            },
            {
              idempotencyKey: `upload-notification-${linkId}-${auth.session.viewerId}`,
              idempotencyKeyTTL: `${NOTIFICATION_DELAY_MS / 1000}s`,
              delay: new Date(Date.now() + NOTIFICATION_DELAY_MS),
            },
          )
          .catch((error) => {
            console.error("Error triggering upload notification:", error);
          }),
      );
    }

    return NextResponse.json({
      success: true,
      document: {
        id: document.id,
        name: document.name,
        dataroomDocumentId: dataroomDocument.id,
        documentVersionId: document.versions[0]?.id,
        folderId: targetFolderId,
        fileType: document.type,
        hasPages: (document.numPages ?? 0) > 0,
        createdAt: document.createdAt,
      },
    });
  } catch (error) {
    console.error("Error uploading document:", error);
    return NextResponse.json(
      { message: "Error uploading document" },
      { status: 500 },
    );
  }
}
