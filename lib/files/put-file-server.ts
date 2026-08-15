import { PutObjectCommand } from "@aws-sdk/client-s3";
import { DocumentStorageType } from "@prisma/client";
import path from "node:path";
import { match } from "ts-pattern";

import { newId } from "@/lib/id-helper";
import { safeSlugify } from "@/lib/utils";

import { SUPPORTED_DOCUMENT_MIME_TYPES } from "../constants";
import { getS3ClientAndConfig } from "./aws-client";

// `File` is a web API type and not available server-side, so we need to define our own type
type File = {
  name: string;
  type: string;
  buffer: Buffer;
};

export const putFileServer = async ({
  file,
  teamId,
  docId,
  restricted = true,
}: {
  file: File;
  teamId: string;
  docId?: string;
  restricted?: boolean;
}) => {
  // One object store, so no transport to choose. The match this replaced keyed
  // on NEXT_PUBLIC_UPLOAD_TRANSPORT, which the deployment does not set — so it
  // fell to `.otherwise()` and returned { type: null, data: null }, i.e. every
  // server-side upload reported success while storing nothing.
  const { type, data } = await putFileInS3Server({
    file,
    teamId,
    docId,
    restricted,
  });

  return { type, data };
};


const putFileInS3Server = async ({
  file,
  teamId,
  docId,
  restricted = true,
}: {
  file: File;
  teamId: string;
  docId?: string;
  restricted?: boolean;
}) => {
  if (!docId) {
    docId = newId("doc");
  }

  if (
    restricted &&
    file.type !== "image/png" &&
    file.type !== "image/jpeg" &&
    file.type !== "application/pdf"
  ) {
    throw new Error("Only PNG, JPEG, PDF or MP4 files are supported");
  }

  if (!restricted && !SUPPORTED_DOCUMENT_MIME_TYPES.includes(file.type)) {
    throw new Error("Unsupported file type");
  }

  const { client, config } = getS3ClientAndConfig();

  // Get the basename and extension for the file
  const { name, ext } = path.parse(file.name);

  const slugifiedName = safeSlugify(name) + ext;
  const originalFileName = `${name}${ext}`;
  const key = `${teamId}/${docId}/${slugifiedName}`;

  const params = {
    Bucket: config.bucket,
    Key: key,
    Body: file.buffer,
    ContentType: file.type,
    ContentDisposition: `attachment; filename="${slugifiedName}"; filename*=UTF-8''${encodeURIComponent(originalFileName)}`,
  };

  // Create a new instance of the PutObjectCommand with the parameters
  const command = new PutObjectCommand(params);

  // Send the command to S3
  await client.send(command);

  return {
    type: DocumentStorageType.S3_PATH,
    data: key,
  };
};
