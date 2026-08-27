# Conflict Register

Status: `COMPLETE / OPEN FOR FUTURE PRODUCT DECISIONS`

These conflicts are not research failures. They are incompatible values, audience differences or cost boundaries that Original Product Principles and later PRD work must resolve explicitly. “Decision required” does not authorize that work in this phase.

| Conflict ID | Required conflict check | Evidence on side A | Evidence on side B | Current classification | Decision required later | Do not resolve by |
|---|---|---|---|---|---|---|
| `CR-01` | WorldOS behavior vs user need | WorldOS records observed versioning, Memory visibility, Rewind boundaries, paid-turn behavior, projection lag and permission paths | User Needs N01–N08, N21–N23, N29, N34, N37, N42–N46 ask for control, correction, portability, transparent change and coherent state | `CONFLICT` + `COMPLEMENT` | Which observed mechanisms solve a user problem, which need redesign, and which are irrelevant | Treating parity as requirements or copying observed defects |
| `CR-02` | WorldOS mechanisms vs Creator templates | WorldOS exposes a particular set of creator forms, publish/version flows, Apps and runtime projections | T01–T37 describe goals, constraints, secret scopes, resources, causal chains and failure-as-new-state across broader scenario types | `COMPLEMENT` + `CONFLICT` | Which original creator model supports the chosen participation contract and content scope | Copying either WorldOS screens or the template JSON into architecture |
| `CR-03` | Player needs vs Creator needs | Players need immediate playability, understandable rules, control, low-penalty correction and stable continuity | Creators need expressive structure, testing, source-controlled canon, packaging, attribution and maintenance tools | `CONFLICT` + `CONDITIONAL` | Whether the first product prioritizes one role, separates modes, or progressively reveals creator power | Combining both roles into one overloaded default workflow |
| `CR-04` | Sandbox / Companion users vs Game-loop users | N24, N30, N50 and continuity evidence support low-friction companionship, co-writing or open exploration | N10, N17, N35, N37, N51 and many templates support goals, rules, resources, consequences and completion | `CONFLICT` + `CONDITIONAL` | Initial audience and mode contract; whether multiple modes exist and where their boundaries sit | Declaring one universal preference from qualitative evidence |
| `CR-05` | AI initiative vs player agency | N20, N25, N51 and autonomous template mechanisms value a world that acts, progresses and surprises | N29–N30, N35, N37, N50 and N52 demand correction, avatar/action authority, mode fidelity and non-manipulative independence | `CONFLICT` | What the AI may initiate, when it must wait, what is reversible, and how mode/consent changes behavior | Making the AI passive everywhere or autonomous everywhere |
| `CR-06` | Continuity vs freedom | N01–N13, N22–N23, N43–N46 value stable canon, identity, recovery and traceable change | N18, N20, N29–N31 and creative scenarios value freedom, experimentation, branches, rewrite and import | `CONFLICT` + `COMPLEMENT` | Which state is authoritative, what can branch or rewrite, and how users recover without locking creativity | Treating permanence and editability as mutually exclusive global settings |
| `CR-07` | Stability vs creativity | N03, N13, N20, N23, N48 value consistent identity, predictable upgrades and reliable outputs | N20, N25, N48 and open simulation patterns value novelty, emergence and model initiative | `CONFLICT` + `CONDITIONAL` | Mode-specific quality targets, allowable variance, evaluation, rollback and user-facing controls | Selecting a model by one aggregate score |
| `CR-08` | Long-term Memory vs privacy / control | N01–N08, N12, N27 and N43 require durable, retrievable context | N05, N07, N18, N22, N34, N42, N45–N47 require isolation, deletion, visibility controls, exit rights and governance | `CONFLICT` | Retention, scope, inspect/edit/delete semantics, private/canon separation, migration and consent | Maximizing stored context without user-visible boundaries |
| `CR-09` | High immersion vs performance / complexity | Immersion references show audio, weather/time, dynamic maps, spatial cues, Rive/Lottie and WebGL/WebGPU can convey living state | N21, N36, N38, N49 require reliability, accessibility, multilingual legibility and continuity; source notes warn about mobile/tooling cost | `CONFLICT` + `CONDITIONAL` | Minimum sensory promise, accessibility defaults, device budget and graceful degradation | Choosing technology because a demo looks impressive |
| `CR-10` | Rich creator tooling vs onboarding simplicity | N14–N16, N27–N28, N31, N33, N39, N44 and T01–T37 support deep structure and maintenance | N17, N24, N30, N49 and beginner templates require immediate, understandable entry | `CONFLICT` | Target creator level, starter paths, defaults, progressive disclosure and separation from player mode | Exposing the full object model on first use or hiding all causal structure |
| `CR-11` | Visual ambition vs production cost | 239 A-class pool assets, 48 original candidate visuals and immersion references make a rich world presentation feasible | 25 conditional assets, 75 review/reference items, rights review, custom production, performance and accessibility create ongoing cost | `CONFLICT` + `CONDITIONAL` | Which approved product moments justify bespoke art/motion/audio and what can use restrained/reusable systems | Letting the existing asset inventory dictate scope or brand |
| `CR-12` | Brand positioning vs actual capability | Brand directions promise branching, simulation tools, memory/echo, exploration or living-world depth | Product mode, Memory promise, creator depth, immersion level and model quality have not been decided or implemented | `CONFLICT` + `UNKNOWN` | Choose a positioning only after Product Principles and capability proof; then conduct formal clearance | Treating `Simulora` or any candidate as final because the repository uses it |

## Cross-cutting decision rule

For every later product decision affected by this register, record four separate statements:

1. **User evidence:** which Needs or audience condition motivates the decision.
2. **Reference evidence:** which competitor, template, content or feasibility source informs it.
3. **Original decision and reason:** what this product chooses and why.
4. **Acceptance test:** how the chosen trade-off will be verified.

If the only reason is “WorldOS has it,” “a template contains it,” or “an asset already exists,” the decision is not supported.

## Deferred questions, not hidden resolutions

This register intentionally leaves all 12 conflicts open. None is a justification for broad new research now. They are ready to be handled as explicit value choices in Original Product Principles; later targeted validation is allowed only under the gate in the [Product-Relevant Gap Audit](PRODUCT_RELEVANT_GAP_AUDIT.md).

