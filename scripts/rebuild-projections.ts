// IP-9.6 operator procedure: rebuild Return orientation projections from the
// authoritative State Revisions. Projections are derived, so this never reads
// or writes World truth; a missing or drifted projection is simply rebuilt.
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  AuthoritativeWorldRepository,
  createDatabasePool,
  type DatabasePool,
} from "../packages/database/src/index.js";

// `pg` is a dependency of the database package, not of this workspace root.
type Pool = DatabasePool;

export type ProjectionRebuildSummary = {
  /** FRESH projections whose source head no longer matched the Branch head. */
  markedStale: number;
  rebuilt: number;
  failed: number;
  /** True when the queue drained within the step budget. */
  drained: boolean;
};

export async function rebuildProjections(
  pool: Pool,
  options: { branchIds?: readonly string[]; maxSteps?: number } = {},
): Promise<ProjectionRebuildSummary> {
  const repository = new AuthoritativeWorldRepository(pool);
  const scope = options.branchIds ?? null;
  // A projection that claims FRESH for an older head is drift; mark it so the
  // same queue that serves normal rebuilds picks it up.
  const marked = await pool.query(
    `update simulora.return_orientation_projections p
     set status = 'STALE', updated_at = now(), row_version = row_version + 1
     from simulora.branches b
     where p.branch_id = b.id and p.status = 'FRESH'
       and p.source_head_commit_id is distinct from b.head_commit_id
       and ($1::uuid[] is null or b.id = any($1::uuid[]))`,
    [scope],
  );
  const summary: ProjectionRebuildSummary = {
    markedStale: marked.rowCount ?? 0,
    rebuilt: 0,
    failed: 0,
    drained: false,
  };
  const targets = scope ? [...scope] : [undefined];
  const maxSteps = options.maxSteps ?? 10_000;
  for (const branchId of targets) {
    for (let step = 0; step < maxSteps; step += 1) {
      try {
        const rebuilt = await repository.processNextProjection(branchId);
        if (!rebuilt) break;
        summary.rebuilt += 1;
      } catch {
        // The branch stays STALE and visible; the next run retries it.
        summary.failed += 1;
        break;
      }
    }
  }
  const remaining = await pool.query<{ count: string }>(
    // Only projections the queue serves count: an inactive Branch or a
    // tombstoned Continuity is never rebuilt, by design.
    `select count(*)
     from simulora.branches b
     join simulora.continuities c on c.id = b.continuity_id and c.status = 'ACTIVE'
     left join simulora.return_orientation_projections p on p.branch_id = b.id
     where b.status = 'ACTIVE' and c.active_branch_id = b.id
       and (p.branch_id is null or p.status in ('STALE', 'REBUILDING'))
       and ($1::uuid[] is null or b.id = any($1::uuid[]))`,
    [scope],
  );
  summary.drained = remaining.rows[0]?.count === "0" && summary.failed === 0;
  return summary;
}

if (process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1])) {
  const connectionString = process.env.SIMULORA_DATABASE_URL;
  if (!connectionString) throw new Error("SIMULORA_DATABASE_URL is required");
  const pool = createDatabasePool(connectionString);
  try {
    const summary = await rebuildProjections(pool);
    console.log(JSON.stringify(summary));
    if (!summary.drained) process.exitCode = 1;
  } finally {
    await pool.end();
  }
}
