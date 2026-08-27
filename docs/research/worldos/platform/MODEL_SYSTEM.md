# Model System

Status: `PARTIAL / TESTED UI`

WorldOS official model tiers display per-Turn cost. Each Simulation selects its model independently. Subscription enables OpenRouter BYOK and OpenAI-compatible gateways; UI says BYOK runs do not consume Zaps. Real external keys and provider error states were not tested.

## BYOK entitlement boundary

Account → World Model exposes OpenRouter BYOK instructions, but the key input is disabled until a paid BYOK entitlement. The modal offers one-time/subscription tabs, ¥19.9/30-day self-hosted API support, international-card toggle, estimated-turn disclaimer and Stripe checkout handoff. After purchase, the documented flow is to enter the key, select models (including free models), then choose the BYOK model inside each Simulation's Settings.

Evidence: `EVD-0070`.
