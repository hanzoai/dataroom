import prisma from "@/lib/prisma";
import { kv } from "@/lib/kv";

import { getKey } from "./kv";

/**
 * Clears all redirect URLs for every domain belonging to a team,
 * removing them from both Postgres and KV.
 */
export async function clearTeamDomainRedirects(
  teamId: string,
): Promise<void> {
  const domains = await prisma.domain.findMany({
    where: { teamId, redirectUrl: { not: null } },
    select: { slug: true },
  });

  if (domains.length === 0) return;

  await Promise.all([
    prisma.domain.updateMany({
      where: { teamId, redirectUrl: { not: null } },
      data: { redirectUrl: null },
    }),
    ...domains.map((d) => kv.del(getKey(d.slug))),
  ]);
}
