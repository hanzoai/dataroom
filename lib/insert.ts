/**
 * Insert rows, leaving alone any that are already there.
 *
 * This is `createMany({ skipDuplicates: true })`, which sqlite does not have.
 * Prisma does not merely ignore the option there — it rejects the call with
 * "Unknown argument `skipDuplicates`", so every site that passed it was
 * throwing at runtime rather than degrading.
 *
 * The batch insert is still tried first, because that is the common case and it
 * is one statement. Only a uniqueness collision falls back to row-at-a-time,
 * which skips the rows that already exist. That fallback is idempotent, so it
 * is still correct if the batch managed to write some rows before colliding.
 *
 * Rows go in one at a time on the slow path deliberately: sqlite takes a single
 * writer, and a caught P2002 leaves an open transaction usable, so this is safe
 * to call inside `$transaction` with `tx` as the model.
 */

const DUPLICATE = "P2002";

const isDuplicate = (error: unknown): boolean =>
  typeof error === "object" && error !== null && (error as { code?: string }).code === DUPLICATE;

// The row type comes from `createMany` alone, so callers get exactly the check
// they had before. `create` takes a wider input than `createMany` — it also
// accepts nested relation writes — and inferring from both would put those two
// types in conflict, so the single-row call is left unconstrained.
type Model<T> = {
  createMany(args: { data: T[] }): Promise<{ count: number }>;
  create(args: { data: any }): Promise<unknown>;
};

/** Returns the number of rows actually written. */
export async function insert<T>(model: Model<T>, rows: T[]): Promise<number> {
  if (rows.length === 0) return 0;

  try {
    const { count } = await model.createMany({ data: rows });
    return count;
  } catch (error) {
    if (!isDuplicate(error)) throw error;
  }

  let written = 0;
  for (const row of rows) {
    try {
      await model.create({ data: row });
      written++;
    } catch (error) {
      if (!isDuplicate(error)) throw error;
    }
  }
  return written;
}
