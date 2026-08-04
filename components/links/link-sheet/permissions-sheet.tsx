"use client";

import { useEffect, useMemo, useState } from "react";

import { useTeam } from "@/context/team-context";
import { PermissionGroupAccessControls } from "@prisma/client";
import { File, Folder } from "lucide-react";
import useSWR from "swr";

import {
  DataroomFolderWithDocuments,
  useDataroomFoldersTree,
} from "@/lib/swr/use-dataroom";
import { DataroomItemType, ITEM_TYPE, ItemPermission } from "@/lib/types";
import { fetcher } from "@/lib/utils";

import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Switch } from "@/components/ui/switch";

/** One row of the permission tree, flattened with its nesting depth. */
type PermissionRow = {
  id: string;
  name: string;
  itemType: DataroomItemType;
  depth: number;
};

/**
 * Flatten the dataroom tree depth-first so a folder always precedes the items
 * it contains. Depth rides on the row rather than being rebuilt from the tree,
 * which keeps rendering a plain list.
 */
function flatten(
  folders: DataroomFolderWithDocuments[],
  depth = 0,
): PermissionRow[] {
  return folders.flatMap((folder) => [
    {
      id: folder.id,
      name: folder.name,
      itemType: ITEM_TYPE.folder,
      depth,
    },
    ...folder.documents.map((doc) => ({
      id: doc.id,
      name: doc.document.name,
      itemType: ITEM_TYPE.document,
      depth: depth + 1,
    })),
    ...flatten(folder.childFolders ?? [], depth + 1),
  ]);
}

/**
 * Edits which dataroom items a link may reach.
 *
 * Two states, deliberately: either the link sees the whole data room (`onSave`
 * receives null and the caller drops the permission group), or it sees exactly
 * the items ticked here. There is no third "inherit" state to reason about.
 */
export function PermissionsSheet({
  isOpen,
  setIsOpen,
  dataroomId,
  permissionGroupId,
  onSave,
}: {
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
  dataroomId: string;
  linkId?: string;
  permissionGroupId?: string | null;
  onSave: (permissions: ItemPermission | null) => void;
}) {
  const teamId = useTeam()?.currentTeam?.id;
  const { folders, loading } = useDataroomFoldersTree({
    dataroomId,
    include_documents: true,
  });

  const { data: group } = useSWR<{
    permissionGroup: { accessControls: PermissionGroupAccessControls[] };
  }>(
    isOpen && teamId && permissionGroupId
      ? `/api/teams/${teamId}/datarooms/${dataroomId}/permission-groups/${permissionGroupId}`
      : null,
    fetcher,
  );

  const rows = useMemo(() => flatten(folders ?? []), [folders]);

  const [entireDataroom, setEntireDataroom] = useState(!permissionGroupId);
  const [permissions, setPermissions] = useState<ItemPermission>({});

  // Seed from the saved group once it arrives; items it does not mention are
  // simply not granted.
  useEffect(() => {
    const controls = group?.permissionGroup?.accessControls;
    if (!controls) return;
    setEntireDataroom(controls.length === 0);
    setPermissions(
      Object.fromEntries(
        controls.map((control) => [
          control.itemId,
          {
            view: control.canView,
            download: control.canDownload,
            itemType: control.itemType as DataroomItemType,
          },
        ]),
      ),
    );
  }, [group]);

  const set = (row: PermissionRow, view: boolean, download: boolean) =>
    setPermissions((prev) => ({
      ...prev,
      // download without view is not a state a viewer can be in
      [row.id]: { view: view || download, download, itemType: row.itemType },
    }));

  const handleSave = () => {
    if (entireDataroom) {
      onSave(null);
      return;
    }
    // Send every row so denials are explicit rather than gaps.
    onSave(
      Object.fromEntries(
        rows.map((row) => [
          row.id,
          permissions[row.id] ?? {
            view: false,
            download: false,
            itemType: row.itemType,
          },
        ]),
      ),
    );
  };

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetContent className="flex w-full flex-col sm:max-w-2xl">
        <SheetHeader>
          <SheetTitle>File permissions</SheetTitle>
        </SheetHeader>

        <label className="flex items-center justify-between gap-4 border-b py-4">
          <span className="text-sm">
            Share the entire data room
            <span className="block text-xs text-muted-foreground">
              Turn off to choose individual folders and files.
            </span>
          </span>
          <Switch
            checked={entireDataroom}
            onCheckedChange={setEntireDataroom}
          />
        </label>

        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <p className="py-6 text-sm text-muted-foreground">Loading…</p>
          ) : entireDataroom ? (
            <p className="py-6 text-sm text-muted-foreground">
              Everything in this data room is shared with this link.
            </p>
          ) : rows.length === 0 ? (
            <p className="py-6 text-sm text-muted-foreground">
              This data room is empty.
            </p>
          ) : (
            <table className="w-full text-sm">
              <thead className="sticky top-0 bg-background">
                <tr className="border-b text-left text-xs text-muted-foreground">
                  <th className="py-2 font-medium">Item</th>
                  <th className="w-20 py-2 font-medium">View</th>
                  <th className="w-24 py-2 font-medium">Download</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => {
                  const view = permissions[row.id]?.view ?? false;
                  const download = permissions[row.id]?.download ?? false;
                  return (
                    <tr key={row.id} className="border-b last:border-0">
                      <td className="py-2">
                        <span
                          className="flex items-center gap-2 truncate"
                          style={{ paddingLeft: row.depth * 16 }}
                        >
                          {row.itemType === ITEM_TYPE.folder ? (
                            <Folder className="h-4 w-4 shrink-0" />
                          ) : (
                            <File className="h-4 w-4 shrink-0" />
                          )}
                          <span className="truncate">{row.name}</span>
                        </span>
                      </td>
                      <td className="py-2">
                        <Switch
                          checked={view}
                          onCheckedChange={(next) =>
                            set(row, next, next && download)
                          }
                        />
                      </td>
                      <td className="py-2">
                        <Switch
                          checked={download}
                          onCheckedChange={(next) => set(row, view, next)}
                        />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>

        <SheetFooter>
          <Button variant="outline" onClick={() => setIsOpen(false)}>
            Cancel
          </Button>
          <Button onClick={handleSave}>Save permissions</Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
