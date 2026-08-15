import { getStringList } from "@/lib/config";

export const isBlacklistedEmail = async (email: string) => {
  const blacklistedEmails = await getStringList("emails");
  if (blacklistedEmails.length === 0) return false;
  return new RegExp(blacklistedEmails.join("|"), "i").test(email);
};

