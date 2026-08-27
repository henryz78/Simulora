# Cross-Agent Evidence Integration Protocol

Status: `ACTIVE — RECEIVING AND MERGING RESEARCH PACKAGES`

This protocol governs how later user-provided ZIPs and research reports are received into the Simulora evidence corpus. It deliberately stops before Original Product Principles, Product Requirements, Architecture, UI or Implementation.

## A. Receiving a package

When a ZIP or report arrives:

1. Preserve the original archive/report unchanged. Record its original name, handoff location, date/time and SHA-256 when available.
2. Assign the next `EPKG-*` package ID. Do not reuse an ID for a revised or superseding archive.
3. Inspect the top-level manifest, README, indexes and final report first. Identify the package's own Source of Truth before reading every artifact.
4. Record identity, account, environment, sample, method, time window and artifact completeness. Keep raw evidence and report-only claims separate.
5. Copy the intake template and fill in scope, core findings, evidence references, repeat boundary and open gaps.
6. Compare against the existing inventory and frozen WorldOS merge documents. Classify each relationship as supporting, overlap, conflict, complementary or not comparable.
7. Run a conflict check before accepting a claim. Do not average different accounts, dates, objects, models, prompts, locales or viewport snapshots into one rule.
8. Run a product-relevant gap audit only at the evidence level: identify which gaps exist and whether they could affect a future approved decision. Do not invent a decision or start research because a gap exists.
9. Append the package, relation and change-log entries to `CROSS_AGENT_EVIDENCE_INVENTORY.md`.
10. Mark the package `MERGED`, `GAP_REVIEW` or `BLOCKED`. Mark `FROZEN` only when its accepted claims and residual limits are stable for the current integration version.

## B. Evidence acceptance rules

- A package's own final report is not automatically its Source of Truth; use the package's declared index/manifest and verify the raw artifact chain.
- Retain provenance namespaces such as `EVD-*`, `MANUS-*`, `MARVIS-*`, `ANON-*`, interview IDs, survey IDs and asset/license IDs.
- `EXTERNAL_RAW` can support a bounded external finding; it does not become primary direct evidence.
- `EXTERNAL_REPORT_ONLY` remains report-only when screenshots, transcripts, HTML, datasets or timestamps are missing or mismatched.
- `CONTRADICTORY_SNAPSHOT` records both observations and their scope. It is not resolved by choosing the newer, larger or more convenient number.
- `NOT_COMPARABLE` is used when the compared objects, users, prompts, models, locales, devices, methods or states differ materially.
- A defect/quirk describes an observation. It is not a root-cause diagnosis and does not imply that an original product should copy it.
- Reference libraries, asset pools, templates and WorldOS feature lists remain evidence or inspiration layers until independently translated through approved product principles.

## C. ZIP and raw artifact handling

- Never overwrite an existing source directory with an incoming ZIP.
- Prefer a new package directory such as `docs/research/external/<source>/<package-id>/raw/` and keep the original ZIP beside the unpacked copy when repository storage is authorized.
- If the archive is too large or cannot be copied, record the external handoff path and hash; do not pretend the raw package is locally preserved.
- Do not delete duplicates or normalize filenames during intake unless the package owner supplied an explicit manifest and the original-to-retained mapping is recorded.
- Do not store secrets, API keys, payment data or personal credentials in the repository.

## D. Minimum merge record

Every package must answer these questions before it can be frozen:

1. What is the package's Source of Truth?
2. What was studied, and what was not studied?
3. Which findings are directly supported, and by which artifacts?
4. What provenance and scope limits apply?
5. What should not be researched again?
6. What gaps remain, and why are they or are they not decision-blocking?
7. How does the package support, overlap, conflict with or complement existing evidence?
8. What exact claims were accepted, deferred or rejected?

## E. No automatic research trigger

The following do not, by themselves, justify a new study:

- a package contains `UNKNOWN` or `BLOCKED` results;
- two dynamic snapshots differ;
- an external report lacks a raw screenshot;
- a reference library does not map neatly to a feature;
- a WorldOS behavior is not covered by a new package;
- a package is incomplete or still pending.

Targeted validation may be proposed only when a specific unresolved question blocks an already approved original product decision. The proposal must state the object, identity, preconditions, operation, distinguishable outcomes, stop condition and external side effects.

## F. Integration freeze gate

The evidence corpus may be marked `Integrated Research Freeze` when:

- all received packages have an intake record and preserved provenance;
- each package has a disposition (`MERGED`, `GAP_REVIEW` or `BLOCKED`);
- material cross-source conflicts are recorded without silent reconciliation;
- gaps are classified as accepted, deferred, blocked or genuinely decision-relevant;
- no pending package is being represented as evidence already received;
- the corpus still clearly separates research evidence from future product requirements.

This gate does not authorize product design. The next separate phase is:

`Original Product Principles` → `Product Requirements` → `Architecture` → `Differentiation Review` → `Implementation Planning`

## G. Package handoff format

For each future package, the user can provide:

- the original ZIP or report as an attachment, or a stable local path;
- the package name/version and originating agent;
- any package README, final report or manifest designated as its Source of Truth;
- whether raw screenshots, transcripts, HTML, CSV/JSON, source notes and license metadata are included;
- any known account/identity/device/time boundaries;
- whether the package supersedes an earlier package or is an additive follow-up.

If some of these are unavailable, send the package anyway and label the missing fields; do not recreate them by guessing.

## H. What I will return for each package

The integration response will be concise and structured as:

1. Package ID and preservation status.
2. Source of Truth and scope.
3. Core findings with provenance.
4. Closed / do-not-repeat areas.
5. Remaining gaps and whether they are decision-blocking.
6. Supporting, overlapping, conflicting and complementary relations.
7. Merge status and any requested metadata clarification.

No product requirement or implementation task will be inferred from the package during this phase.

### Change log

| Date | Change | Author / source |
|---|---|---|
| 2026-08-26 | Created package receiving, provenance, conflict, gap-audit and freeze protocol. | Research Integration Agent |
