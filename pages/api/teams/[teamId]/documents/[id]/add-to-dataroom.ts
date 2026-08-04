import { NextApiRequest, NextApiResponse } from "next";

import { authOptions } from "@/pages/api/auth/[...nextauth]";
import { getServerSession } from "next-auth/next";

import { errorhandler } from "@/lib/errorHandler";
import prisma from "@/lib/prisma";
import { CustomUser } from "@/lib/types";

export default async function handle(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  if (req.method === "POST") {
    // POST /api/teams/:teamId/documents/:id/add-to-dataroom
    const session = await getServerSession(req, res, authOptions);
    if (!session) {
      return res.status(401).end("Unauthorized");
    }

    const { teamId, id: docId } = req.query as { teamId: string; id: string };
    const { dataroomId } = req.body as { dataroomId: string };

    const userId = (session.user as CustomUser).id;

    try {
      const team = await prisma.team.findUnique({
        where: {
          id: teamId,
          users: {
            some: {
              userId,
            },
          },
          documents: {
            some: {
              id: {
                equals: docId,
              },
            },
          },
        },
        select: {
          id: true,
          plan: true,
        },
      });

      if (!team) {
        return res.status(401).end("Unauthorized");
      }

      if (
        (team.plan === "free" || team.plan === "pro") &&
        !team.plan.includes("drtrial")
      ) {
        return res.status(403).json({
          message: "Upgrade your plan to use datarooms.",
        });
      }

      // Fetch dataroom with AI settings
      const dataroom = await prisma.dataroom.findUnique({
        where: { id: dataroomId },
        select: {
          id: true,
          teamId: true,
          name: true,
        },
      });

      if (!dataroom) {
        return res.status(404).json({
          message: "Dataroom not found!",
        });
      }

      // Fetch document with primary version
      const document = await prisma.document.findUnique({
        where: { id: docId },
        include: {
          versions: {
            where: { isPrimary: true },
            take: 1,
          },
        },
      });

      if (!document) {
        return res.status(404).json({
          message: "Document not found!",
        });
      }

      let dataroomDocument;
      try {
        dataroomDocument = await prisma.dataroomDocument.create({
          data: {
            documentId: docId,
            dataroomId,
          },
        });
      } catch (error) {
        return res.status(500).json({
          message: "Document already exists in dataroom!",
        });
      }

      return res.status(200).json({
        message: "Document added to dataroom!",
      });
    } catch (error) {
      errorhandler(error, res);
    }
  } else {
    // We only allow POST requests
    res.setHeader("Allow", ["POST"]);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}
