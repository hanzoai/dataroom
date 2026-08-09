import { getConfig } from "@/lib/config";

/** The per-team sender address, if that team has one configured. */
export const getCustomEmail = async (teamId?: string) => {
  if (!teamId) return null;

  const customEmails = await getConfig<Record<string, string | null>>(
    "customEmail",
    {},
  );
  return customEmails[teamId] || null;
};
