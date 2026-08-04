import { useMemo } from "react";

import { UploadIcon } from "lucide-react";
import { useTheme } from "next-themes";
import { useDropzone } from "react-dropzone";
import { toast } from "sonner";

import { FULL_PLAN_ACCEPTED_FILE_TYPES } from "@/lib/constants";
import { bytesToSize } from "@/lib/utils";
import { fileIcon } from "@/lib/utils/get-file-icon";
import {
  UPLOAD_LIMITS,
  getFileSizeLimit,
} from "@/lib/utils/get-file-size-limits";
import { getPagesCount } from "@/lib/utils/get-page-number-count";

export default function DocumentUpload({
  currentFile,
  setCurrentFile,
}: {
  currentFile: File | null;
  setCurrentFile: React.Dispatch<React.SetStateAction<File | null>>;
}) {
  const { theme, systemTheme } = useTheme();
  const isLight =
    theme === "light" || (theme === "system" && systemTheme === "light");

  const { getRootProps, getInputProps } = useDropzone({
    accept: FULL_PLAN_ACCEPTED_FILE_TYPES,
    multiple: false,
    onDropAccepted: (acceptedFiles) => {
      if (acceptedFiles.length === 0) {
        return;
      }
      const file = acceptedFiles[0];
      const fileType = file.type;
      const fileSizeLimitMB = getFileSizeLimit(fileType); // in MB
      const fileSizeLimit = fileSizeLimitMB * 1024 * 1024; // in bytes

      if (file.size > fileSizeLimit) {
        toast.error(
          `File size too big for ${fileType} (max. ${fileSizeLimitMB} MB)`,
        );
        return;
      }

      if (file.type !== "application/pdf") {
        setCurrentFile(file);
        return;
      }
      file
        .arrayBuffer()
        .then((buffer) => {
          getPagesCount(buffer).then((numPages) => {
            if (numPages > UPLOAD_LIMITS.maxPages) {
              toast.error(
                `File has too many pages (max. ${UPLOAD_LIMITS.maxPages})`,
              );
            } else {
              setCurrentFile(file);
            }
          });
        })
        .catch((error) => {
          console.error("Error reading file:", error);
          toast.error("Failed to read the file");
        });
    },
    onDropRejected: (fileRejections) => {
      const { errors, file } = fileRejections[0];
      let message;
      if (errors[0].code === "file-too-large") {
        message = `File size too big (max. ${getFileSizeLimit(file.type)} MB)`;
      } else if (errors[0].code === "file-invalid-type") {
        message = "File type not supported";
      } else {
        message = errors[0].message;
      }
      toast.error(message);
    },
  });

  const imageBlobUrl = useMemo(
    () => (currentFile ? URL.createObjectURL(currentFile) : ""),
    [currentFile],
  );

  return (
    <div className="col-span-full">
      <div
        {...getRootProps()}
        className="group relative block cursor-pointer font-semibold text-foreground hover:bg-gray-100 hover:text-gray-900 hover:dark:bg-gray-900 hover:dark:text-gray-500"
      >
        <input {...getInputProps()} name="file" className="sr-only" />
        <div className="flex min-h-[200px] items-center justify-center rounded-lg border border-dashed border-black/25 px-6 py-10 dark:border-white/25 md:min-w-full">
          {currentFile ? (
            <div
              className="pointer-events-none absolute inset-0 opacity-10 transition-opacity group-hover:opacity-5"
              style={{
                backgroundImage: `url(${imageBlobUrl})`,
                backgroundPosition: "center",
                backgroundSize: "cover",
              }}
            />
          ) : null}

          <div className="max-w-md text-center">
            {currentFile ? (
              <div className="flex flex-col items-center text-foreground sm:flex-row sm:space-x-2">
                <div>
                  {fileIcon({
                    fileType: currentFile.type,
                    isLight,
                  })}
                </div>
                <p className="max-w-md truncate">{currentFile.name}</p>
                <p className="text-gray-500">{bytesToSize(currentFile.size)}</p>
              </div>
            ) : (
              <UploadIcon
                className="mx-auto h-10 w-10 text-gray-500"
                aria-hidden="true"
              />
            )}

            <div className="mt-4 flex text-sm leading-6 text-gray-500">
              <span className="mx-auto">
                {currentFile ? "" : "Choose file to upload or drag and drop"}
              </span>
            </div>
            <p className="text-xs leading-5 text-gray-500">
              {currentFile
                ? "Replace file?"
                : `Only *.pdf, *.pptx, *.docx, *.xlsx, *.xls, *.xlsm, *.csv, *.tsv, *.ods, *.ppt, *.odp, *.doc, *.odt, *.rtf, *txt, *.dwg, *.dxf, *.png, *.jpg, *.jpeg, *.mp4, *.mov, *.avi, *.webm, *.ogg`}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
