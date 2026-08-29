# Simulora Experience Prototype Archive

Status: `APPROVED P1/P2/P3 BASELINE + P4 WORLD STUDIO FROZEN`

This directory contains the React/Vite clickable prototype used to explore the approved P1, P2 and P3 experience slices:

- P1 — Action Truth
- P2 — Return Orientation, Continuity Lens and correction
- P3 — Recovery Lab
- P4 — World Studio (Living Draft + Fieldbook clarity), independently re-gated and frozen against implementation baseline `bf04f5227dec213f45d4c75433b4e570f411e3cb`

The snapshot was imported into the repository's single `main` development line from the independent prototype history at commit `9d87170ec2c48c4359db355535b3c6df9bc66b05` (`prototype: freeze approved P3 recovery lab baseline`). That source commit is recorded here as provenance; the imported files in this directory are the maintained readable snapshot after retiring the separate prototype branch.

## What this is

This is a high-fidelity, clickable comprehension prototype. It is useful for reviewing interaction semantics, state language, responsive behavior and approved P1/P2/P3 gate evidence.

It is not the product runtime, backend, persistence layer, model gateway, database, API, production component library or final visual system. Prototype state is local mock state only. The formal product and system contracts remain in [`docs/product/`](../../docs/product/) and [`docs/system-design/`](../../docs/system-design/).

## Running the snapshot

From this directory:

```text
pnpm install
pnpm dev
```

The prototype uses the existing Vite configuration and serves the clickable experience locally. It may be inspected and extended for future prototype slices, but any behavior promoted to the product must be re-derived from the frozen Product Definition, System Design and Experience Structure documents.

The orbit mark and world hero currently resolve from the prototype environment's `/manus-storage/...` paths. They are not vendored into this repository because their source/provenance is environment-specific; a standalone clone may therefore fall back to the CSS treatment when the Manus storage proxy is not configured. This does not represent product asset availability or a product implementation decision.

## Continuation rule

The repository now uses `main` as the single daily development line. New prototype work should live under this directory (or a clearly named sibling under `prototypes/`) and must retain an explicit prototype-only boundary. The approved and frozen P4 slice is documented in [`P4_WORLD_STUDIO_PROTOTYPE_EXPLORATION.md`](./P4_WORLD_STUDIO_PROTOTYPE_EXPLORATION.md) and [`P4_WORLD_STUDIO_PROTOTYPE_REPORT.md`](./P4_WORLD_STUDIO_PROTOTYPE_REPORT.md); it starts from the approved P1/P2/P3 snapshot and does not revive the abandoned earlier P4 exploration. Future work must not silently alter this baseline without a new explicit review decision.
