import { useState } from "react";

import { useTeam } from "@/context/team-context";
import { Check, Copy } from "lucide-react";
import { toast } from "sonner";
import { mutate } from "swr";

import { useDataroom } from "@/lib/swr/use-dataroom";

import { DataroomHeader } from "@/components/datarooms/dataroom-header";
import { DataroomNavigation } from "@/components/datarooms/dataroom-navigation";
import DataroomTagSection from "@/components/datarooms/settings/dataroom-tag-section";
import DeleteDataroom from "@/components/datarooms/settings/delete-dataroooom";
import DuplicateDataroom from "@/components/datarooms/settings/duplicate-dataroom";
import SettingsTabs from "@/components/datarooms/settings/settings-tabs";
import AppLayout from "@/components/layouts/app";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Form } from "@/components/ui/form";
import { Input } from "@/components/ui/input";

export default function Settings() {
  const { dataroom } = useDataroom();
  const teamInfo = useTeam();
  const teamId = teamInfo?.currentTeam?.id;
  const [isCopied, setIsCopied] = useState(false);

  if (!dataroom) {
    return <div>Loading...</div>;
  }

  return (
    <AppLayout>
      <main className="relative mx-2 mb-10 mt-4 space-y-8 overflow-hidden px-1 sm:mx-3 md:mx-5 md:mt-5 lg:mx-7 lg:mt-8 xl:mx-10">
        <header>
          <DataroomHeader
            title={dataroom.name}
            description={dataroom.pId}
            internalName={dataroom.internalName}
            actions={[]}
          />

          <DataroomNavigation dataroomId={dataroom.id} />
        </header>

        {/* Settings */}
        <div className="mx-auto grid w-full gap-2">
          <h1 className="text-2xl font-semibold">Settings</h1>
        </div>
        <div className="mx-auto grid w-full items-start gap-6 md:grid-cols-[180px_1fr] lg:grid-cols-[250px_1fr]">
          <SettingsTabs dataroomId={dataroom.id} />
          <div className="grid gap-6">
            <Form
              title="Dataroom Name"
              description="This is the public name of your data room visible to all viewers."
              inputAttrs={{
                name: "name",
                placeholder: "My Dataroom",
                maxLength: 156,
              }}
              defaultValue={dataroom.name}
              helpText="Max 156 characters"
              handleSubmit={(updateData) =>
                fetch(`/api/teams/${teamId}/datarooms/${dataroom.id}`, {
                  method: "PATCH",
                  headers: {
                    "Content-Type": "application/json",
                  },
                  body: JSON.stringify(updateData),
                }).then(async (res) => {
                  if (res.status === 200) {
                    await Promise.all([
                      mutate(`/api/teams/${teamId}/datarooms`),
                      mutate(`/api/teams/${teamId}/datarooms?simple=true`),
                      mutate(`/api/teams/${teamId}/datarooms/${dataroom.id}`),
                    ]);
                    toast.success("Successfully updated dataroom name!");
                  } else {
                    const { error } = await res.json();
                    toast.error(error.message);
                  }
                })
              }
            />
            <Form
              title="Internal Name"
              description="A private name only visible to you. Useful for distinguishing multiple data rooms with the same public name."
              inputAttrs={{
                name: "internalName",
                placeholder: "e.g., Series A - Sequoia, Buyer Group A",
                maxLength: 156,
              }}
              defaultValue={dataroom.internalName ?? ""}
              helpText="Max 156 characters. Leave empty to remove."
              handleSubmit={(updateData) =>
                fetch(`/api/teams/${teamId}/datarooms/${dataroom.id}`, {
                  method: "PATCH",
                  headers: {
                    "Content-Type": "application/json",
                  },
                  body: JSON.stringify({
                    internalName: updateData.internalName || null,
                  }),
                }).then(async (res) => {
                  if (res.status === 200) {
                    await Promise.all([
                      mutate(`/api/teams/${teamId}/datarooms`),
                      mutate(`/api/teams/${teamId}/datarooms/${dataroom.id}`),
                    ]);
                    toast.success("Successfully updated internal name!");
                  } else {
                    const { error } = await res.json();
                    toast.error(error.message);
                  }
                })
              }
            />
            <Form
              title="Show Last Updated"
              description="Display the last updated date on your dataroom banner."
              inputAttrs={{
                name: "showLastUpdated",
                type: "checkbox",
                placeholder: "Show last updated date",
              }}
              defaultValue={String(dataroom.showLastUpdated ?? true)}
              helpText="When enabled, visitors will see when the dataroom was last updated."
              handleSubmit={(updateData) =>
                fetch(`/api/teams/${teamId}/datarooms/${dataroom.id}`, {
                  method: "PATCH",
                  headers: {
                    "Content-Type": "application/json",
                  },
                  body: JSON.stringify({
                    showLastUpdated: updateData.showLastUpdated === "true",
                  }),
                }).then(async (res) => {
                  if (res.status === 200) {
                    await Promise.all([
                      mutate(`/api/teams/${teamId}/datarooms`),
                      mutate(`/api/teams/${teamId}/datarooms?simple=true`),
                      mutate(`/api/teams/${teamId}/datarooms/${dataroom.id}`),
                    ]);
                    toast.success("Successfully updated display settings!");
                  } else {
                    const { error } = await res.json();
                    toast.error(error.message);
                  }
                })
              }
            />
            <DataroomTagSection
              dataroomId={dataroom.id}
              teamId={teamId!}
              initialTags={dataroom.tags}
            />

            <DuplicateDataroom dataroomId={dataroom.id} teamId={teamId} />
            <Card className="bg-transparent">
              <CardHeader>
                <CardTitle>Dataroom ID</CardTitle>
                <CardDescription>
                  Unique ID of your dataroom on Hanzo Dataroom.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center space-x-2">
                  <div className="relative w-full max-w-md">
                    <Input
                      value={dataroom.id}
                      className="pr-10 font-mono"
                      readOnly
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                      onClick={() => {
                        navigator.clipboard.writeText(dataroom.id);
                        toast.success("Dataroom ID copied to clipboard");
                        setIsCopied(true);
                        setTimeout(() => setIsCopied(false), 2000);
                      }}
                    >
                      {isCopied ? (
                        <Check className="h-4 w-4" />
                      ) : (
                        <Copy className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </div>
              </CardContent>
              <CardFooter className="flex items-center justify-between rounded-b-lg border-t bg-muted px-6 py-6">
                <p className="text-sm text-muted-foreground transition-colors">
                  Used to identify your dataroom when interacting with the Hanzo
                  Dataroom API.
                </p>
              </CardFooter>
            </Card>

            <DeleteDataroom
              dataroomId={dataroom.id}
              dataroomName={dataroom.name}
            />
          </div>
        </div>
      </main>
    </AppLayout>
  );
}
