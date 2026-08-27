# Phase-4 supplemental · App B/Guest recheck (user-transcribed result)

Date reported: 2026-08-24 (Asia/Shanghai)  
Target: `https://worldos.cc/zh-cn/apps/test-app-first-publish-001`  
Identities: Guest and authenticated Account B  
Source status: `EXTERNAL_BLACKBOX_REPORTED / ARTIFACT_NOT_ARCHIVED`

## Reported observations

| Time | Identity | Action | Result |
|---|---|---|---|
| 14:21:35 | Guest | Open direct URL | 404, `This page could not be found.` |
| 14:23:44 | Guest | Hard refresh | Still 404 |
| 14:26:18 | Account B | Open direct URL | 404 |
| 14:27:08 | Account B | Hard refresh | Still 404 |
| 14:27–14:29 | Account B | App Market search by title/slug | No results |
| 14:30–14:31 | Account B | Unified Search by title/slug, including App tab | No matching result |
| 14:32 | Account B | Direct URL for deleted control App `test-app-delete-lifecycle-001` | Same generic 404 shape |

## Interpretation boundary

This is independent non-owner/Guest evidence as reported by the user from the witness Agent. It materially strengthens the earlier Account-B 404 observation: the target was not merely omitted from Search; its direct URL also returned 404 for both identities across refreshes, while a known deleted App showed the same shape.

The evidence still cannot distinguish among `unpublished`, `downlisted`, private visibility, an owner-side lifecycle transition, or a product permission defect. The current owner-side baseline (`EVD-0174`) shows the same slug as public v2 and editable, so the cross-account discrepancy is real but its backend cause remains `UNKNOWN` until a same-time owner→B/Guest controlled comparison or an owner visibility transition is captured.

No payment, credential, security bypass, or destructive action is implied by this transcript. The original screenshots/document are not present in the workspace yet; attach them later if available so timestamps and visual 404 text can be independently checked.

## Confidence

- Guest direct 404 + refresh: `EXTERNAL_BLACKBOX_REPORTED / HIGH` (original artifact not archived)
- Account B direct 404 + refresh: `EXTERNAL_BLACKBOX_REPORTED / HIGH` (original artifact not archived)
- Search omission in Market and Unified Search: `EXTERNAL_BLACKBOX_REPORTED / HIGH` (original artifact not archived)
- Same-shape comparison with deleted App: `EXTERNAL_BLACKBOX_REPORTED / MEDIUM-HIGH`
- Root cause (delete vs unpublish/downlist/private/permission defect): `UNKNOWN`
