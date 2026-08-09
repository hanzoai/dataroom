import prisma from "@/lib/prisma";

/**
 * The team's webhooks that asked for this trigger.
 *
 * Postgres selected these in the query with `array_contains` over the triggers
 * column. Sqlite has no json array operator and Prisma rejects the argument
 * outright, so the subscription list is matched here instead. A team has a
 * handful of webhooks, and this already runs off the request path.
 */
export async function subscribers(teamId: string, trigger: string) {
  const webhooks = await prisma.webhook.findMany({
    where: { teamId },
    select: { pId: true, url: true, secret: true, triggers: true },
  });

  return webhooks.filter((webhook) => webhook.triggers.includes(trigger));
}
