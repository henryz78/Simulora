import { expect, test, type Page, type Route } from "@playwright/test";
import { expectAccessible } from "./support/accessibility.js";

// Transport fixture only. The sealed proposals, derived impact, SQL parity and
// Commits are proven on real PostgreSQL by tests/integration/mgc1-closure.test.ts.
const continuityId = "50000000-0000-4000-8000-000000000001";
const branchId = "50000000-0000-4000-8000-000000000002";
const worldRevisionId = "50000000-0000-4000-8000-000000000005";
const participation = { initiativeMode: "GUIDED", structureMode: "OPEN_ENDED" } as const;

type Thread = { id: string; title: string; status: "OPEN" | "RESOLVED"; resolution?: string };
type Posted = {
  intent: string;
  expectedHeadCommitId: string;
  idempotencyKey: string;
  requestedEffect?: string;
  targetCharacterId?: string;
  targetThreadId?: string;
};

async function install(page: Page) {
  let head = "50000000-0000-4000-8000-000000000003";
  let turn = 0;
  let relationshipState = "wary";
  let threads: Thread[] = [
    { id: "thread.vessel", title: "Why the unfamiliar vessel waits", status: "OPEN" },
  ];
  const posted: Posted[] = [];
  const actions = new Map<string, Record<string, unknown>>();
  const effects = new Map<string, () => void>();

  const state = () => ({
    continuity: {
      id: continuityId,
      branchId,
      headCommitId: head,
      stateRevisionId: "50000000-0000-4000-8000-000000000004",
      worldRevisionId,
      worldRevisionNumber: 1,
    },
    world: {
      schemaVersion: 1,
      title: "Lantern Reach — closure fixture",
      premise: "A tidal observatory keeps a coastal settlement oriented through persistent fog.",
      startingSituation: "The western signal has dimmed while an unfamiliar vessel waits.",
      userRole: {
        name: "Observatory keeper",
        authorityBoundary: "The world never authors user speech.",
      },
      locations: [
        { id: "location.tidal-observatory", name: "Tidal Observatory", description: "A tower." },
        { id: "location.harbor", name: "Harbor", description: "A sheltered harbor." },
      ],
      characters: [
        {
          id: "character.iora",
          name: "Iora",
          role: "Harbor signaler",
          locationId: "location.tidal-observatory",
        },
        {
          id: "character.tavi",
          name: "Tavi",
          role: "Lamp runner",
          locationId: "location.tidal-observatory",
        },
      ],
      facts: [
        {
          id: "fact.signal",
          statement: "The western signal is dim.",
          scope: "SHARED",
          provenance: "Original World seed",
          lifecycle: "ACTIVE",
        },
      ],
      relationships: [
        {
          id: "relationship.iora-tavi",
          fromCharacterId: "character.iora",
          toCharacterId: "character.tavi",
          description: "Iora is training Tavi to read the markers.",
          protection: "ROUTINE",
          scale: ["wary", "cordial", "trusting"],
          initialState: "wary",
        },
      ],
      threads: [{ id: "thread.vessel", title: "Why the unfamiliar vessel waits" }],
      constraints: [
        {
          id: "constraint.flood",
          statement: "The causeway floods at high tide; no one crosses it then.",
        },
      ],
      interactionPaths: ["Inspect the signal."],
      interactionBoundaries: ["The world never authors user speech."],
      objectives: [],
    },
    state: {
      schemaVersion: 1,
      participation,
      worldClock: { turn, label: turn ? `After action ${turn}` : "Opening moment" },
      locations: [],
      entities: [],
      characters: [
        {
          id: "character.iora",
          name: "Iora",
          role: "Harbor signaler",
          locationId: "location.tidal-observatory",
          currentState: "Present at Tidal Observatory.",
        },
        {
          id: "character.tavi",
          name: "Tavi",
          role: "Lamp runner",
          locationId: "location.tidal-observatory",
          currentState: "Present at Tidal Observatory.",
        },
      ],
      facts: [
        {
          id: "fact.signal",
          statement: "The western signal is dim.",
          scope: "SHARED",
          lifecycle: "ACTIVE",
        },
      ],
      relationships: [
        {
          id: "relationship.iora-tavi",
          fromCharacterId: "character.iora",
          toCharacterId: "character.tavi",
          description: "Iora is training Tavi to read the markers.",
          state: relationshipState,
        },
      ],
      openThreads: ["The western signal has dimmed while an unfamiliar vessel waits."],
      threads,
      objectives: [],
      resources: {},
      interactionBoundaries: ["The world never authors user speech."],
      customState: {},
    },
    source: { stateHash: "b".repeat(64) },
    // The fixture's administrative policy lets only Tavi move (SA-2 exposes it).
    routineMoverIds: ["character.tavi"],
  });

  const json = (route: Route, body: unknown, status = 200) =>
    route.fulfill({ status, contentType: "application/json", body: JSON.stringify(body) });

  await page.route(`**/v1/continuities/${continuityId}/state**`, (route) => json(route, state()));
  await page.route(`**/v1/continuities/${continuityId}/orientation`, (route) =>
    json(route, {
      continuity: { id: continuityId, branchId, worldRevisionId },
      current: {
        situation: "The western signal is dim.",
        locationId: "location.tidal-observatory",
        worldClock: state().state.worldClock,
      },
      recentChanges: [],
      relationships: [
        {
          id: "relationship.iora-tavi",
          description: "Iora is training Tavi to read the markers.",
          state: relationshipState,
        },
      ],
      openThreads: ["The western signal has dimmed while an unfamiliar vessel waits."],
      threads,
      nextParticipation: { expectedHeadCommitId: head, label: "Continue from the current world." },
      pendingActions: [],
      freshness: {
        sourceHeadCommitId: head,
        currentHeadCommitId: head,
        status: "FRESH",
        headDistance: 0,
      },
      authoritativeFallback: {
        stateUrl: `/v1/continuities/${continuityId}/state`,
        headCommitId: head,
        stateRevisionId: "50000000-0000-4000-8000-000000000004",
      },
      projectionUpdatedAt: new Date().toISOString(),
    }),
  );
  await page.route(`**/v1/branches/${branchId}/actions**`, async (route) => {
    if (route.request().method() === "GET") {
      const history = [...actions.values()].map((action) => ({
        id: action.id,
        status: action.status,
        intent: action.intent,
        acknowledgedAt: action.acknowledgedAt,
        committedAt: action.status === "COMMITTED" ? action.terminalAt : null,
        narrative: null,
      }));
      return json(route, { branchId, actions: history });
    }
    const input = route.request().postDataJSON() as Posted;
    posted.push(input);
    const number = posted.length;
    const id = `50000000-0000-4000-8000-${String(100 + number).padStart(12, "0")}`;
    let proposal: { impact: string; target: string; before: string; after: string };
    if (input.requestedEffect === "RELATIONSHIP_EFFECT") {
      proposal = {
        impact: "L2",
        target: "relationship.iora-tavi",
        before: relationshipState,
        after: "cordial",
      };
      effects.set(id, () => {
        relationshipState = "cordial";
      });
    } else if (input.targetThreadId) {
      proposal = { impact: "L2", target: input.targetThreadId, before: "OPEN", after: "RESOLVED" };
      effects.set(id, () => {
        threads = threads.map((thread) =>
          thread.id === input.targetThreadId
            ? { ...thread, status: "RESOLVED", resolution: "It carries lamp oil for the harbor." }
            : thread,
        );
      });
    } else {
      // The movement cannot happen: the world proposes a transformed failure.
      proposal = {
        impact: "L2",
        target: "constraint.flood",
        before: "The causeway is under water and the crossing waits.",
        after: "Find another way to the harbor",
      };
      effects.set(id, () => {
        threads = [...threads, { id: `thread.${id}`, title: proposal.after, status: "OPEN" }];
      });
    }
    const action = {
      id,
      continuityId,
      branchId,
      expectedHeadCommitId: input.expectedHeadCommitId,
      status: "AWAITING_CONFIRMATION",
      intent: input.intent,
      participationExpectation: participation,
      acknowledgedAt: new Date().toISOString(),
      terminalAt: null,
      recoverableWait: false,
      statusReason: null,
      progressUrl: `/v1/actions/${id}/progress`,
      eventsUrl: `/v1/actions/${id}/events`,
      proposal: {
        id: `51000000-0000-4000-8000-${String(number).padStart(12, "0")}`,
        digest: String(number).repeat(64).slice(0, 64),
        expectedHeadCommitId: input.expectedHeadCommitId,
        impact: proposal.impact,
        expiresAt: new Date(Date.now() + 60_000).toISOString(),
        narrative: "The harbor answers in its own time.",
        responseSource: {
          type: "CHARACTER",
          characterId: input.targetCharacterId ?? "character.iora",
        },
        displayEffect: {
          target: proposal.target,
          before: proposal.before,
          after: proposal.after,
          scope: "SHARED",
        },
      },
      commit: null,
    };
    actions.set(id, action);
    return json(route, { ...action, status: "ACKNOWLEDGED", proposal: null }, 201);
  });
  await page.route("**/v1/actions/**", async (route) => {
    const url = new URL(route.request().url());
    const id = url.pathname.split("/")[3]!;
    const action = actions.get(id)!;
    if (url.pathname.endsWith("/events")) {
      return route.fulfill({
        status: 200,
        contentType: "text/event-stream",
        body: "event: heartbeat\ndata: {}\n\n",
      });
    }
    if (url.pathname.endsWith("/confirm")) {
      effects.get(id)?.();
      turn += 1;
      head = `52000000-0000-4000-8000-${String(turn).padStart(12, "0")}`;
      const committed = {
        ...action,
        status: "COMMITTED",
        terminalAt: new Date().toISOString(),
        commit: {
          id: head,
          resultingHeadCommitId: head,
          stateRevisionId: "53000000-0000-4000-8000-000000000001",
          committedAt: new Date().toISOString(),
        },
      };
      actions.set(id, committed);
      return json(route, committed);
    }
    if (url.pathname.endsWith("/cancel")) {
      const cancelled = { ...action, status: "CANCELLED", terminalAt: new Date().toISOString() };
      actions.set(id, cancelled);
      return json(route, cancelled);
    }
    return json(route, action);
  });
  return { posted };
}

test("relationship, thread and transformed-failure outcomes are reviewed exactly before they change the world", async ({
  page,
}) => {
  const { posted } = await install(page);
  await page.goto(`/continuities/${continuityId}`);
  const context = page.getByLabel("Current world context");
  const outcome = page.getByLabel("Desired outcome");

  // A relationship change needs a Character that is part of a scaled relationship.
  await expect(
    outcome.locator("option", { hasText: "Change how this character relates" }),
  ).toBeDisabled();
  await page.getByLabel("Address a character").selectOption("character.iora");
  await outcome.selectOption("RELATIONSHIP_EFFECT");
  await page.getByLabel("Your Action").fill("Show Tavi how to read the outer markers.");
  await page.getByRole("button", { name: "Send Action" }).click();
  await expect(page.getByText("Provisional — not current truth")).toBeVisible();
  const review = page.locator(".proposal-review");
  await expect(review).toContainText("Relationship · Iora and Tavi");
  await expect(review).toContainText("wary");
  await expect(review).toContainText("cordial");
  await expect(review).toContainText("A small, everyday change");
  await expect(context.getByRole("list", { name: "Relationships" })).toContainText("wary");
  await expectAccessible(page);
  await page.getByRole("button", { name: "Confirm this exact change" }).click();
  await expect(context.getByRole("list", { name: "Relationships" })).toContainText("cordial");
  expect(posted.at(-1)).toMatchObject({
    requestedEffect: "RELATIONSHIP_EFFECT",
    targetCharacterId: "character.iora",
  });

  // Resolving names the exact thread; nothing changes before confirmation.
  await outcome.selectOption("THREAD_EFFECT:thread.vessel");
  await page.getByLabel("Your Action").fill("Ask the vessel what it carries.");
  await page.getByRole("button", { name: "Send Action" }).click();
  await expect(review).toContainText("Story thread");
  await expect(context.getByRole("list", { name: "Story threads" })).toContainText("Open");
  await page.getByRole("button", { name: "Confirm this exact change" }).click();
  await expect(context.getByRole("list", { name: "Story threads" })).toContainText(
    "Resolved · Why the unfamiliar vessel waits",
  );
  expect(posted.at(-1)).toMatchObject({
    requestedEffect: "THREAD_EFFECT",
    targetThreadId: "thread.vessel",
  });

  // An impossible movement comes back as a transformed failure the user can reject.
  await page.getByLabel("Address a character").selectOption("character.tavi");
  await outcome.selectOption("ROUTINE_EFFECT");
  await page.getByLabel("Your Action").fill("Send Tavi across the causeway.");
  await page.getByRole("button", { name: "Send Action" }).click();
  await expect(review).toContainText("World constraint · The causeway floods at high tide");
  await expect(review).toContainText("The attempt fails");
  await expect(review).toContainText("New open thread");
  await page.getByRole("button", { name: "Cancel Action" }).click();
  await expect(context.getByRole("list", { name: "Story threads" })).not.toContainText(
    "Find another way to the harbor",
  );
  await expect(page.getByLabel("Your Action")).toBeEnabled();
});

test("Return shows structured threads and relationship state, not the narrative trail", async ({
  page,
}) => {
  await install(page);
  await page.goto(`/continuities/${continuityId}/return`);
  await expect(
    page.getByRole("heading", { name: "Story threads and relationships" }),
  ).toBeVisible();
  await expect(page.getByRole("list", { name: "Story threads" })).toContainText(
    "Open · Why the unfamiliar vessel waits",
  );
  await expect(page.getByRole("list", { name: "Relationships" })).toContainText("now wary");
  await expect(page.getByText("Recent developments")).toBeVisible();
  await expectAccessible(page);
});

test("SA-2: movement is offered only to movers, and an uninformed Character's refusal is explained", async ({
  page,
}) => {
  await install(page);
  await page.goto(`/continuities/${continuityId}`);
  const outcome = page.getByLabel("Desired outcome");
  const move = outcome.locator("option", { hasText: "Have this character move" });
  await page.getByLabel("Address a character").selectOption("character.iora");
  await expect(move).toBeDisabled();
  await page.getByLabel("Address a character").selectOption("character.tavi");
  await expect(move).toBeEnabled();

  // The API refuses an addressed Character that cannot know the Action's target.
  await page.route(`**/v1/branches/${branchId}/actions`, (route) =>
    route.request().method() === "POST"
      ? route.fulfill({
          status: 422,
          contentType: "application/json",
          body: JSON.stringify({
            code: "WORLD_NOT_PLAYABLE",
            message: "The selected Character is unavailable or cannot know this Action target",
          }),
        })
      : route.fallback(),
  );
  await page.getByLabel("Your Action").fill("Ask Tavi what the tide will do.");
  await page.getByRole("button", { name: "Send Action" }).click();
  await expect(
    page.getByText("This character does not know anything this Action can be about yet."),
  ).toBeVisible();
  await expectAccessible(page);
});

test.describe("in a Chinese browser", () => {
  test.use({ locale: "zh-CN" });
  test("the uninformed Character's refusal is still explained", async ({ page }) => {
    await install(page);
    await page.route(`**/v1/branches/${branchId}/actions`, (route) =>
      route.request().method() === "POST"
        ? route.fulfill({
            status: 422,
            contentType: "application/json",
            body: JSON.stringify({
              code: "WORLD_NOT_PLAYABLE",
              message: "The selected Character is unavailable or cannot know this Action target",
            }),
          })
        : route.fallback(),
    );
    await page.goto(`/continuities/${continuityId}`);
    await page.getByLabel("对哪个角色说").selectOption("character.tavi");
    await page.getByLabel("你的行动").fill("Ask Tavi what the tide will do.");
    await page.getByRole("button", { name: "发送行动" }).click();
    await expect(page.getByText("这个角色还不知道任何和这个行动相关的事。")).toBeVisible();
    await expectAccessible(page);
  });
});
