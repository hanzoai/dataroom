import Link from "next/link";
import { useRouter } from "next/router";

import React, { useMemo } from "react";

import { ChevronRightIcon } from "lucide-react";

import { useFolderWithParents } from "@/lib/swr/use-folders";

const crumbListStyle: React.CSSProperties = {
  display: "flex",
  flexWrap: "wrap",
  alignItems: "center",
  gap: "0.375rem",
  listStyle: "none",
  margin: 0,
  padding: 0,
  fontSize: "0.875rem",
  color: "var(--muted-foreground)",
};

function BreadcrumbComponentBase({ name }: { name: string[] }) {
  const { folders: folderNames } = useFolderWithParents({ name });

  return (
    <nav aria-label="breadcrumb">
      <ol style={crumbListStyle}>
        <li key={"root"}>
          <Link href="/documents">Documents</Link>
        </li>
        {folderNames &&
          folderNames.map((item, index: number, array) => {
            return (
              <React.Fragment key={index}>
                <li role="presentation" aria-hidden="true">
                  <ChevronRightIcon size={14} />
                </li>
                {index === array.length - 1 ? (
                  <li>
                    <span
                      role="link"
                      aria-disabled="true"
                      aria-current="page"
                      className="capitalize"
                      style={{
                        color: "var(--foreground)",
                        textTransform: "capitalize",
                      }}
                    >
                      {item.name}
                    </span>
                  </li>
                ) : (
                  <li>
                    <Link
                      href={`/documents/tree${item.path}`}
                      className="capitalize"
                      style={{ textTransform: "capitalize" }}
                    >
                      {item.name}
                    </Link>
                  </li>
                )}
              </React.Fragment>
            );
          })}
      </ol>
    </nav>
  );
}

const BreadcrumbComponent = () => {
  const router = useRouter();
  const name = router.query.name as string[];

  // Use useMemo to memoize the base component with the current name value.
  // This way, BreadcrumbComponentBase is only re-rendered when name changes.
  const MemoizedBreadcrumbComponent = useMemo(() => {
    return <BreadcrumbComponentBase name={name} />;
  }, [name]);

  return MemoizedBreadcrumbComponent;
};

export { BreadcrumbComponent };
