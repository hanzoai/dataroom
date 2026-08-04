import { NextApiRequest, NextApiResponse } from "next";

import { getServerSession } from "next-auth/next";

import { errorhandler } from "@/lib/errorHandler";
import prisma from "@/lib/prisma";
import { CustomUser } from "@/lib/types";

import { authOptions } from "../../../auth/[...nextauth]";

/**
 * GET /api/teams/:teamId/billing/plan
 *
 * Reports the team's plan tag. Hanzo Dataroom has no paywall: the tag records
 * which tier a team is provisioned on, it never gates a capability.
 */
export default async function handle(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  if (req.method !== "GET") {
    res.setHeader("Allow", ["GET"]);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }

  const session = await getServerSession(req, res, authOptions);
  if (!session) {
    return res.status(401).end("Unauthorized");
  }

  const { teamId } = req.query as { teamId: string };
  const userId = (session.user as CustomUser).id;

  try {
    const team = await prisma.team.findUnique({
      where: { id: teamId, users: { some: { userId } } },
      select: { plan: true, startsAt: true, endsAt: true },
    });

    if (!team) {
      return res.status(404).json({ error: "Team not found" });
    }

    return res.status(200).json({
      plan: team.plan,
      startsAt: team.startsAt,
      endsAt: team.endsAt,
    });
  } catch (error) {
    errorhandler(error, res);
  }
}
