# System States Audit

Status: `PARTIAL / In Progress`

Observed Empty: no Characters; no Search results; empty Notification modal; empty Presets; no Memory before threshold; empty Collection/Comment states; no-match unified Search.

Observed Loading: World Creator `Loading world`; App Market delayed initial DOM; publish/install usage check; Turn `世界正在回应…`; disabled controls during generation.

Observed Membership/Error: private/unlisted/extra Apps/export/BYOK/Theme walls; insufficient wallet buttons disabled; DELETE gate; App delete irreversible confirmation.

Observed validation/recovery: World create button disabled until required fields; App save warns `保存前需要先有名称和可用的 HTML。`; malformed App JSON saves without error and reloads as `{}`; Search no-match preserves type tabs; Character/Mine/Notification/Memory each have distinct empty copy.

Still pending: valid-key AI-provider failure distinct from transport loss, complete deleted/inaccessible recovery and broader avatar format/size/network validation. Network interruption/reload rollback is covered by EVD-0201; App iframe script-error rendering and recovery by EVD-0202; invalid BYOK by EVD-0208; insufficient Credits by EVD-0212; valid/invalid avatar selection by EVD-0217.

# Avatar auto-save and invalid-file silent clear (EVD-0217)

- Valid SVG selection immediately replaces the avatar, resets the file input and updates a fixed public `avatar.svg` URL with a new `v` cache query. There is no crop/preview/progress/toast/explicit Save state; Account reload and public Profile retain it.
- Invalid `.txt` selection produces no visible validation error and no relevant console error, but clears the existing avatar to the generic fallback across reload/Profile.
- A later valid upload restores the image. Treat the invalid path as a destructive-silent defect baseline; format/size/network limits remain open.

# App Preview script error (EVD-0202)

- A throwing inline script does not replace or visibly fail the iframe; surrounding HTML still renders.
- The only detected failure is in the iframe console. Creator save remains allowed, and reload reproduces the same broken runtime without a warning.
- Editing back to valid HTML and saving repairs the same Draft. There is no dedicated Retry/Reset-error state beyond ordinary HTML editing and `重置预览`.
# Network-interrupted Turn (EVD-0201)

- On submit while offline, the UI optimistically advances the Turn and shows `世界正在回应…` plus `连接中断,正在恢复本回合…`.
- Input, Send and Timeline are disabled during the recovery state; no Retry/Cancel control was exposed.
- Restoring network did not recover within the tested ~12.5-second window. Reload rolled the Simulation back to the prior Turn, discarded the failed action and did not charge energy.
- Data semantics are atomic/recoverable; in-place automatic recovery is a reproducible stuck UX candidate.

# Invalid BYOK key (EVD-0208)

- Final `测试并保存` returns inline `key 无效，请检查后重试。` for a synthetic invalid key.
- Reveal/hide remains usable after the failure. Reload clears both the value and error and leaves the model inventory unchanged.

# Underfunded Turn and exhausted-balance block (EVD-0212)

- Positive-but-insufficient balance is not blocked: 1 energy can commit an 8-energy Turn and persist -7.
- The next attempt at -7 creates no generation and opens `电量用完了` with dismiss, purchase and Rewards entries.
- After quota recovery, the blocker does not recur, the committed Turn remains and the rejected action is absent.
