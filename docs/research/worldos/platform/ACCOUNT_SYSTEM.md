# Account System

Status: `TESTED UI / PARTIAL lifecycle`

See `ACCOUNT_MODELS_BYOK.md`. Settings tabs cover Profile, Preferences, World Model/BYOK, Presets and Account. Profile affects recommendation; delete requires exact DELETE and claims to remove account, Worlds and simulations. Final deletion was not executed.

Account Persona presets are not merely stored profile artifacts. EVD-0236 verifies that a Simulation's one-time identity form can browse a persisted Persona preset and copy its exact name/persona into per-Simulation `playerSetup`; the identity then affects the next World Turn. The corresponding World `/new` preset buttons remain a stable no-op in the tested build, so preset transfer is surface-dependent.

EVD-0249 narrows composition further. The Simulation listbox contains Persona records only; Style/Lore are not selectable there. Preset selection replaces current name/persona fields, later manual edits remain visibly authoritative, and avatar can be chosen from URL/upload, owned Characters, Emoji, avatar, flag, wallpaper and scene sources. Save still has the zero-cost one-time lock contract. However, a World initialized with its own `身份=Alice` field kept using `Alice` in Character Chat after a later manual identity Save, so Account/Simulation identity does not have verified universal priority over World setup variables.

EVD-0237 completes a second Account control pass. Preferences contains only the three language buttons in the observed build; the danger CTA enables only for exact uppercase `DELETE` with no surrounding whitespace. Current BYOK is a stable `限免` state rather than the earlier member gate. Persona/Style/Lore add forms use optimistic visible counts, inline required-field errors and type-specific schemas; three new minimal records survive reload.

Authentication route `/zh-cn/login` exposes Google sign-in and email/password. Registration is an in-place mode with email, password, confirm password and optional invitation code; final submit was not executed. Forgot-password mode asks for email and `发送验证码`, then returns to login. Logout/session-expiration behavior remains pending.

Global account menu exposes Profile, Account Settings, Buy Credits, Earn Credits, QQ group, theme (`跟随系统`), language and `退出登录`. Logout was not clicked to preserve the authenticated research session.
## Profile editing and public propagation

- Profile fields include avatar upload, username, bio, gender (`未设置` / `男` / `女` / `非二元` / `不愿透露`) and a multi-select interest-tag taxonomy whose copy says it affects recommendation and category ordering.
- Avatar uses a hidden single `accept=image/*` input behind two visible upload buttons. Valid SVG, PNG and JPEG all auto-save immediately with no crop/preview/toast or Profile `保存资料`; the public per-user object keeps the current format's `.svg`/`.png`/`.jpg` extension and changes a `v` cache query on replacement. Account reload and all three public Profile projections use it. Invalid `.txt` selection silently clears the current avatar to the generic fallback with no error; a later valid upload restores it. This is a defect baseline, not a recommended validation contract (EVD-0217, EVD-0222).
- A bio update through `保存资料` persisted after full reload and appeared on the account's public Profile route. Owner Profile `编辑资料` deep-links back to this Account tab.
- Username collision/rename URL behavior, WEBP/GIF/size/aspect/orientation/avatar network failure, deliberate avatar reset, independent-viewer cache timing and recommendation reranking remain `UNKNOWN`.

Evidence: EVD-0103, EVD-0209, EVD-0217.

## Language preference and localized content

- Preferences offers English, Español and 中文. The choice persists across reload/navigation and controls route normalization: English uses unprefixed routes, Spanish `/es`, Chinese `/zh-cn`.
- World, Collection and Character titles/descriptions on the same stable slugs/IDs render locale-specific variants. Missing variants can fall back to the original string.
- Español showed one transient current-render delay immediately after selection, then resolved on full navigation/reload.

Evidence: EVD-0106.
