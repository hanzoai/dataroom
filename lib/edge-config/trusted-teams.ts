import { getStringList } from "@/lib/config";

export const isTrustedTeam = async (teamId: string): Promise<boolean> => {

  let trustedTeams: string[] = [];
  try {
    const result = await getStringList("trustedTeams");
    trustedTeams = Array.isArray(result)
      ? result.filter((item): item is string => typeof item === "string")
      : [];
  } catch (e) {
    // Already initialized as empty array
  }

  if (trustedTeams.length === 0) return false;
  return trustedTeams.includes(teamId);
};
