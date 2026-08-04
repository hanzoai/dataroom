import { useRouter } from "next/router";

import { useState } from "react";

import { useTeam } from "@/context/team-context";
import { XIcon } from "lucide-react";
import { toast } from "sonner";
import { mutate } from "swr";
import { z } from "zod";

import { useAnalytics } from "@/lib/analytics";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const dataroomSchema = z.object({
  name: z.string().trim().min(3, {
    message: "Please provide a dataroom name with at least 3 characters.",
  }),
});

export function AddDataroomModal({
  children,
  openModal = false,
  setOpenModal,
}: {
  children?: React.ReactNode;
  openModal?: boolean;
  setOpenModal?: React.Dispatch<React.SetStateAction<boolean>>;
}) {
  const router = useRouter();
  const [dataroomName, setDataroomName] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);
  const [open, setOpen] = useState<boolean>(openModal);

  const teamInfo = useTeam();
  const analytics = useAnalytics();

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    event.stopPropagation();

    const validation = dataroomSchema.safeParse({ name: dataroomName });

    if (!validation.success) {
      return toast.error(validation.error.errors[0].message);
    }

    setLoading(true);

    try {
      const response = await fetch(
        `/api/teams/${teamInfo?.currentTeam?.id}/datarooms`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ name: dataroomName.trim() }),
        },
      );

      if (!response.ok) {
        const { message } = await response.json();
        setLoading(false);
        toast.error(message);
        return;
      }

      const { dataroom } = await response.json();

      analytics.capture("Dataroom Created", { dataroomName: dataroomName });

      mutate(`/api/teams/${teamInfo?.currentTeam?.id}/datarooms`);
      mutate(`/api/teams/${teamInfo?.currentTeam?.id}/datarooms?simple=true`);
      toast.success("Dataroom successfully created! 🎉");
      router.push(`/datarooms/${dataroom.id}/documents`);
    } catch (error) {
      setLoading(false);
      toast.error("Error adding dataroom. Please try again.");
      return;
    } finally {
      setLoading(false);
      setOpen(false);
      if (openModal && setOpenModal) setOpenModal(false);
    }
  };

  const onOpenChange = (open: boolean) => {
    if (!open) {
      setOpen(false);
      setDataroomName("");
    } else {
      setOpen(true);
    }
    if (openModal && setOpenModal) setOpenModal(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="border-none bg-transparent text-foreground shadow-none sm:max-w-[575px] [&>button]:hidden">
        <DialogTitle className="sr-only">Create Dataroom</DialogTitle>
        <DialogDescription className="sr-only">
          Create a new dataroom
        </DialogDescription>

        <Card className="relative outline-none focus:outline-none">
          <button
            onClick={() => onOpenChange(false)}
            className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
          >
            <XIcon className="h-4 w-4" />
            <span className="sr-only">Close</span>
          </button>
          <CardHeader className="space-y-3">
            <CardTitle>Create dataroom</CardTitle>
            <CardDescription>
              Start creating a dataroom with a name.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            <form
              onSubmit={handleSubmit}
              className="flex flex-col space-y-4 outline-none"
            >
              <div className="space-y-1">
                <Label htmlFor="dataroom-name-create">
                  Dataroom Name{" "}
                  <span className="text-black dark:text-white">*</span>
                </Label>
                <Input
                  id="dataroom-name-create"
                  placeholder="ACME Acquisition"
                  value={dataroomName}
                  onChange={(e) => setDataroomName(e.target.value)}
                />
              </div>
              <Button type="submit" className="w-full" loading={loading}>
                Add new dataroom
              </Button>
            </form>
          </CardContent>
        </Card>
      </DialogContent>
    </Dialog>
  );
}
