# WorldOS Phase 2 Evidence Package

**Target:** https://worldos.cc  
**Date:** 2026-08-25 (Asia/Shanghai)  
**Scope:** Creator validation/autosave, non-App discovery short-window timeline, responsive interaction matrix, and locale/deep-link/history routing matrix. App Market category mechanics is optional only after P0/P1 completion.

## Safety and scope controls

All test objects must use the `MANUS-P2-*` prefix. The work does not use paid capabilities, purchase credits or subscriptions, submit API keys, access hidden APIs or private implementation details, conduct security testing, or modify pre-existing non-test assets. Membership-gated branches are recorded as `MEMBERSHIP_BLOCKED` and then stopped. Any indeterminate observation is recorded as `UNKNOWN`.

## Evidence record schema

Every finding record must include the testing identity, URL, timestamp, preconditions, action, visible feedback, persistence outcome, screenshot/video location, and confidence. Screenshots are indexed by source path because browser-provided captures are retained in the session screenshot directory.

## Handoff and cleanup controls

Objects suitable for the discovery timeline are marked `HANDOFF_TO_TASK2` and retained only until their Publish → Rename → Delete lifecycle is complete. Every created `MANUS-P2-*` object must receive one final manifest state: `CLEANED`, `ALREADY_ABSENT`, `CLEANUP_BLOCKED`, or `HANDOFF_COMPLETED`.

## Test file limits

Creator upload checks may use only one small PNG, one small SVG, and one harmless wrong-MIME file. No file exceeds 5 MB.

