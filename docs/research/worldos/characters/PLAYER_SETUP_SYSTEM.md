# Player Setup System

Status: `TESTED / PARTIAL`

World `/new` asks optional owner-defined initialization fields. Generic, social, strategy and map Worlds show different setup prompts/defaults; map Worlds can include region/faction context. Setup creates a Simulation configuration separate from later Turn state. More validation/empty/invalid-field behavior remains UNKNOWN.

Evidence: existing Player Setup notes and EVD-0030/0031.
## World-specific setup

Social Worlds can replace the generic player setup with authored prompts, optional name/save-name fields and a World-specific “vibe/route” prompt. The American High School World also exposes two authored Characters with save-to-library, choose-from-library and full-edit actions before Simulation start, plus a UI mode choice (`自由沙盒` vs `文游小手机`). A disabled `另存为人设预设` appears until required identity is present.

Evidence: `EVD-0073`.
