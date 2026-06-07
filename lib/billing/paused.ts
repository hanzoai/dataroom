/**
 * Team-pause stubs.
 *
 * Hanzo Dataroom does not implement subscription pause/unpause — there is no
 * paywall to enforce. These functions exist to keep call sites compiling
 * after the commercial-billing rip; they always report that a team is active.
 */

export function isTeamPaused(
  _team: { pausedAt?: Date | null; pauseStartsAt?: Date | null; pauseEndsAt?: Date | null } | null | undefined,
): boolean {
  return false;
}

export async function isTeamPausedById(_teamId: string): Promise<boolean> {
  return false;
}
