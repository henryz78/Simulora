import AxeBuilder from "@axe-core/playwright";
import { expect, test, type Page, type Route } from "@playwright/test";

const continuityId = "40000000-0000-4000-8000-000000000001";
const branchId = "40000000-0000-4000-8000-000000000002";
const initialHead = "40000000-0000-4000-8000-000000000003";
const otherHead = "40000000-0000-4000-8000-000000000013";
const stateRevisionId = "40000000-0000-4000-8000-000000000004";
const worldRevisionId = "40000000-0000-4000-8000-000000000005";
const factId = "fact.signal";
const participation = { initiativeMode: "GUIDED", structureMode: "OPEN_ENDED" } as const;
const now = "2026-09-03T00:00:00.000Z";
const later = "2026-09-03T00:01:00.000Z";

type ActionFixture = Record<string, unknown> & {
  id: string;
  status: string;
  intent: string;
};

type RouteOptions = {
  state?: Record<string, unknown>;
  history?: Array<Record<string, unknown>>;
  actions?: Map<string, ActionFixture>;
  orientation?: Record<string, unknown>;
  explanation?: Record<string, unknown>;
  onCorrection?: (route: Route) => Promise<void>;
  onAction?: (route: Route) => Promise<void>;
};

function worldResponse(statement = "The western signal is dim."): Record<string, unknown> {
  return {
    continuity: {
      id: continuityId,
      branchId,
      headCommitId: initialHead,
      stateRevisionId,
      worldRevisionId,
      worldRevisionNumber: 1,
    },
    world: {
      schemaVersion: 1,
      title: "Lantern Reach",
      premise: "A tidal observatory keeps a coastal settlement oriented through persistent fog.",
      startingSituation: "The western signal has dimmed while an unfamiliar vessel waits offshore.",
      userRole: {
        name: "Observatory keeper",
        authorityBoundary: "The world never authors user speech.",
      },
      locations: [
        {
          id: "location.tidal-observatory",
          name: "Tidal Observatory",
          description: "A salt-dark tower.",
        },
      ],
      characters: [
        {
          id: "character.iora",
          name: "Iora",
          role: "Harbor signaler",
          locationId: "location.tidal-observatory",
        },
      ],
      facts: [
        {
          id: factId,
          statement,
          scope: "SHARED",
          provenance: "Original World seed",
          lifecycle: "ACTIVE",
        },
      ],
      relationships: [],
      interactionPaths: ["Inspect the signal."],
      interactionBoundaries: ["The world never authors user speech."],
      objectives: [],
    },
    state: {
      schemaVersion: 1,
      participation,
      worldClock: { turn: 2, label: "The vessel waits offshore" },
      locations: [],
      entities: [],
      characters: [
        {
          id: "character.iora",
          name: "Iora",
          role: "Harbor signaler",
          locationId: "location.tidal-observatory",
          currentState: "Present at the observatory.",
        },
      ],
      facts: [
        {
          id: factId,
          statement,
          scope: "SHARED",
          provenance: "Current Branch state",
          lifecycle: "ACTIVE",
        },
      ],
      relationships: [],
      openThreads: ["The unfamiliar vessel waits offshore."],
      objectives: [],
      resources: {},
      interactionBoundaries: ["The world never authors user speech."],
      customState: {},
    },
    source: { stateHash: "a".repeat(64) },
  };
}

function freshness(
  sourceHeadCommitId = initialHead,
  currentHeadCommitId = initialHead,
  status: "FRESH" | "STALE" | "REBUILDING" = "FRESH",
  headDistance = 0,
): Record<string, unknown> {
  return { sourceHeadCommitId, currentHeadCommitId, status, headDistance };
}

function orientationResponse(): Record<string, unknown> {
  return {
    continuity: { id: continuityId, branchId, worldRevisionId },
    current: {
      situation: "The vessel waits offshore.",
      locationId: "location.tidal-observatory",
      worldClock: { turn: 2, label: "The vessel waits offshore" },
    },
    recentChanges: [],
    relationships: [],
    openThreads: ["The unfamiliar vessel waits offshore."],
    nextParticipation: {
      expectedHeadCommitId: initialHead,
      label: "Continue from the current world state.",
    },
    pendingActions: [],
    freshness: freshness(otherHead, initialHead, "STALE", 1),
    authoritativeFallback: {
      stateUrl: `/v1/continuities/${continuityId}/state`,
      headCommitId: initialHead,
      stateRevisionId,
    },
    projectionUpdatedAt: now,
  };
}

function missingProjectionResponse(): Record<string, unknown> {
  return {
    ...orientationResponse(),
    recentChanges: [],
    freshness: freshness(initialHead, initialHead, "REBUILDING", 0),
    projectionUpdatedAt: null,
  };
}

function correctionAction(): ActionFixture {
  return {
    id: "40000000-0000-4000-8000-000000000021",
    continuityId,
    branchId,
    expectedHeadCommitId: initialHead,
    operationType: "CORRECT_CONTINUITY",
    status: "AWAITING_CONFIRMATION",
    intent: "Correct the western signal fact.",
    participationExpectation: participation,
    acknowledgedAt: now,
    terminalAt: null,
    recoverableWait: false,
    statusReason: null,
    progressUrl: "/v1/actions/40000000-0000-4000-8000-000000000021/progress",
    eventsUrl: "/v1/actions/40000000-0000-4000-8000-000000000021/events",
    proposal: {
      id: "40000000-0000-4000-8000-000000000022",
      digest: "b".repeat(64),
      expectedHeadCommitId: initialHead,
      impact: "L3",
      expiresAt: "2026-09-03T01:00:00.000Z",
      narrative: "Replace the fact with the exact reviewed statement.",
      responseSource: null,
      displayEffect: {
        target: factId,
        before: "The western signal is dim.",
        after: "The western signal is steady.",
        scope: "SHARED",
      },
    },
    commit: null,
  };
}

function pendingAction(
  id: string,
  operationType: "PARTICIPATE" | "CORRECT_CONTINUITY",
  intent: string,
  status: "ACKNOWLEDGED" | "AWAITING_CONFIRMATION",
): ActionFixture {
  return {
    id,
    continuityId,
    branchId,
    expectedHeadCommitId: initialHead,
    operationType,
    status,
    intent,
    participationExpectation: participation,
    acknowledgedAt: now,
    terminalAt: null,
    recoverableWait: false,
    statusReason: null,
    progressUrl: `/v1/actions/${id}/progress`,
    eventsUrl: `/v1/actions/${id}/events`,
    proposal: status === "AWAITING_CONFIRMATION" ? correctionAction().proposal : null,
    commit: null,
  };
}

function traceResponse(): Record<string, unknown> {
  return {
    branchId,
    freshness: freshness(),
    commits: [
      {
        id: "40000000-0000-4000-8000-000000000031",
        parentCommitId: null,
        kind: "WORLD_STARTED",
        sourceClass: "WORLD",
        reason: "The pinned World Revision established the opening state.",
        createdAt: now,
        events: [
          {
            id: "40000000-0000-4000-8000-000000000032",
            type: "STATE_INITIALIZED",
            summary: "The western signal is dim.",
            targetId: factId,
            scope: "SHARED",
          },
        ],
      },
    ],
    nextCursor: null,
  };
}

function explanationResponse(): Record<string, unknown> {
  return {
    target: {
      type: "fact",
      id: factId,
      statement: "The western signal is dim.",
      lifecycle: "ACTIVE",
      current: true,
    },
    source: {
      class: "WORLD",
      commitId: "40000000-0000-4000-000000000031".replace("-000000000031", "-8000-000000000031"),
    },
    scope: "SHARED",
    freshness: freshness(),
    explanation: "This fact is part of the pinned World Revision visible in this Continuity.",
    correction: {
      availableOperations: ["CORRECT_CONTINUITY", "REMOVE_CONTINUITY"],
      href: `/continuities/${continuityId}/correction/${encodeURIComponent(factId)}`,
      requiresExactConfirmation: true,
    },
  };
}

async function json(route: Route, body: unknown, status = 200): Promise<void> {
  await route.fulfill({ status, contentType: "application/json", body: JSON.stringify(body) });
}

async function installRoutes(page: Page, options: RouteOptions = {}): Promise<void> {
  const history = options.history ?? [];
  const actions = options.actions ?? new Map<string, ActionFixture>();
  await page.route(`**/v1/continuities/${continuityId}/state**`, (route) =>
    json(route, options.state ?? worldResponse()),
  );
  await page.route(`**/v1/branches/${branchId}/actions**`, (route) =>
    route.request().method() === "POST" && options.onAction
      ? options.onAction(route)
      : json(route, { branchId, actions: history }),
  );
  await page.route(`**/v1/branches/${branchId}/commits**`, (route) => json(route, traceResponse()));
  await page.route(`**/v1/continuities/${continuityId}/orientation`, (route) =>
    json(route, options.orientation ?? orientationResponse()),
  );
  await page.route(`**/v1/branches/${branchId}/explanations/fact/${factId}`, (route) =>
    json(route, options.explanation ?? explanationResponse()),
  );
  await page.route(`**/v1/branches/${branchId}/corrections`, async (route) => {
    if (options.onCorrection) return options.onCorrection(route);
    await json(route, correctionAction(), 201);
  });
  await page.route("**/v1/actions/**", async (route) => {
    const url = new URL(route.request().url());
    const actionId = url.pathname.split("/")[3];
    if (url.pathname.endsWith("/events")) {
      await route.fulfill({
        status: 200,
        contentType: "text/event-stream",
        body: "event: heartbeat\ndata: {}\n\n",
      });
      return;
    }
    const action = actionId ? actions.get(actionId) : undefined;
    if (!action) {
      await json(route, { code: "NOT_FOUND", message: "Action not found" }, 404);
      return;
    }
    await json(route, action);
  });
}

async function installCountingEventSource(page: Page): Promise<void> {
  await page.addInitScript(() => {
    const stats = { connections: 0, statusEvents: 0 };
    class CountingEventSource {
      url: string;
      onmessage: ((event: Event) => void) | null = null;
      private listeners = new Map<string, Array<(event: Event) => void>>();
      private closed = false;

      constructor(url: string) {
        this.url = url;
        stats.connections += 1;
        window.setTimeout(() => {
          if (this.closed) return;
          stats.statusEvents += 1;
          const event = new Event("action.status");
          this.listeners.get("action.status")?.forEach((listener) => listener(event));
        }, 50);
      }

      addEventListener(type: string, listener: (event: Event) => void): void {
        const listeners = this.listeners.get(type) ?? [];
        listeners.push(listener);
        this.listeners.set(type, listeners);
      }

      close(): void {
        this.closed = true;
      }
    }

    Object.defineProperty(window, "__simuloraEventSourceStats", {
      configurable: true,
      value: stats,
    });
    (window as unknown as { EventSource: unknown }).EventSource = CountingEventSource;
  });
}

test("explicit Character selection is submitted with the Action and lost-ACK retries keep its identity", async ({
  page,
}) => {
  const bodies: Array<Record<string, unknown>> = [];
  await installRoutes(page, {
    onAction: async (route) => {
      bodies.push(route.request().postDataJSON() as Record<string, unknown>);
      await json(route, { code: "TEMPORARY", message: "Acknowledgement unavailable" }, 503);
    },
  });
  await page.goto(`/continuities/${continuityId}`);
  await page.getByLabel("Address a character").selectOption("character.iora");
  await page.getByLabel("Your Action", { exact: true }).fill("Inspect the signal with Iora.");
  await page.getByRole("button", { name: "Send Action", exact: true }).click();
  await expect(page.getByRole("alert")).toContainText("acknowledgement could not be confirmed");
  await page.getByRole("button", { name: "Send Action", exact: true }).click();
  await expect.poll(() => bodies.length).toBe(2);
  expect(bodies[0]?.targetCharacterId).toBe("character.iora");
  expect(bodies[0]?.requestedEffect).toBeUndefined();
  expect(bodies[1]).toEqual(bodies[0]);
  await page.getByLabel("Address a character").selectOption("");
  await page.getByRole("button", { name: "Send Action", exact: true }).click();
  await expect.poll(() => bodies.length).toBe(3);
  expect(bodies[2]?.idempotencyKey).not.toBe(bodies[0]?.idempotencyKey);
  expect(bodies[2]?.targetCharacterId).toBeUndefined();
});

test("explicit requested outcomes reach the Action contract", async ({ page }) => {
  const bodies: Array<Record<string, unknown>> = [];
  await installRoutes(page, {
    onAction: async (route) => {
      bodies.push(route.request().postDataJSON() as Record<string, unknown>);
      await json(route, { code: "TEMPORARY", message: "Acknowledgement unavailable" }, 503);
    },
  });
  await page.goto(`/continuities/${continuityId}`);
  await page.getByLabel("Address a character").selectOption("character.iora");
  await page.getByLabel("Desired outcome").selectOption("ROUTINE_EFFECT");
  await page.getByLabel("Your Action", { exact: true }).fill("Have Iora move to the quay.");
  await page.getByRole("button", { name: "Send Action", exact: true }).click();
  await expect(page.getByRole("alert")).toContainText("acknowledgement could not be confirmed");
  expect(bodies[0]).toMatchObject({
    targetCharacterId: "character.iora",
    requestedEffect: "ROUTINE_EFFECT",
  });

  await page.getByLabel("Desired outcome").selectOption("NO_WORLD_EFFECT");
  await page.getByLabel("Your Action", { exact: true }).fill("Ask Iora what she sees.");
  await page.getByRole("button", { name: "Send Action", exact: true }).click();
  await expect.poll(() => bodies.length).toBe(2);
  expect(bodies[1]).toMatchObject({ requestedEffect: "NO_WORLD_EFFECT" });
  expect(bodies[1]?.idempotencyKey).not.toBe(bodies[0]?.idempotencyKey);
});

test("recoverable generation status explains the bounded retry", async ({ page }) => {
  const action = pendingAction(
    "40000000-0000-4000-8000-000000000071",
    "PARTICIPATE",
    "Inspect the signal while generation retries.",
    "ACKNOWLEDGED",
  );
  action.status = "GENERATING";
  action.recoverableWait = true;
  await installRoutes(page, {
    actions: new Map([[action.id, action]]),
    history: [
      {
        id: action.id,
        status: action.status,
        intent: action.intent,
        acknowledgedAt: now,
        committedAt: null,
        narrative: null,
      },
    ],
  });
  await page.goto(`/continuities/${continuityId}/actions/${action.id}`);
  await expect(page.getByRole("heading", { name: "Generating" })).toBeVisible();
  await expect(
    page.getByText("another bounded generation attempt", { exact: false }),
  ).toBeVisible();
});

test("World, Continuity and Return fallback use current shared facts, not earlier threads", async ({
  page,
}) => {
  const statement = "The western signal is steady green.";
  const state = worldResponse(statement);
  const document = state.state as Record<string, unknown>;
  document.openThreads = ["The western signal has dimmed."];
  document.facts = [
    {
      id: "fact.private",
      statement: "Private lead must stay private.",
      scope: "ACCOUNT_PRIVATE",
      lifecycle: "ACTIVE",
    },
    {
      id: "fact.removed",
      statement: "A removed signal fact.",
      scope: "SHARED",
      lifecycle: "REMOVED",
    },
    { id: factId, statement, scope: "SHARED", lifecycle: "ACTIVE" },
  ];
  await installRoutes(page, { state, orientation: missingProjectionResponse() });
  await page.goto(`/continuities/${continuityId}`);
  await expect(page.locator(".situation-card")).toContainText(statement);
  await expect(page.locator(".situation-card")).not.toContainText("Private lead");
  await expect(page.locator(".starting-background")).toContainText("has dimmed");
  await page.getByRole("link", { name: "Continuity", exact: true }).click();
  await expect(page.getByRole("region", { name: "What currently holds" })).toContainText(statement);
  await page.getByRole("link", { name: "Return", exact: true }).click();
  await expect(page.locator(".orientation-lead")).toHaveText(statement);
  await page.getByRole("link", { name: "Continue in world" }).click();
  await expect(page.locator(".situation-card")).toContainText(statement);
});

test("Return surfaces bounded freshness and falls back to the authoritative World", async ({
  page,
}) => {
  await installRoutes(page);
  await page.goto(`/continuities/${continuityId}/return`);
  await expect(page.getByRole("heading", { name: "Recent recorded changes" })).toBeVisible();
  await expect(page.getByText("Stale · 1 head behind")).toBeVisible();
  await expect(page.getByText("bounded recent-history view", { exact: false })).toBeVisible();
  await expect(
    page.getByText("Recent recorded changes are unavailable", { exact: false }),
  ).toBeVisible();
  await expect(
    page.getByText("There is no recent meaningful change", { exact: false }),
  ).toHaveCount(0);
  await expect(page.getByText("The vessel waits offshore.", { exact: true })).toBeVisible();
  await page.getByRole("link", { name: "Continue in world" }).click();
  await expect(page).toHaveURL(new RegExp(`/continuities/${continuityId}$`));
  await expect(page.getByRole("heading", { name: "Lantern Reach" })).toBeVisible();
  await page.goBack();
  await expect(page.getByRole("heading", { name: "Recent recorded changes" })).toBeVisible();
  expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);
});

test("Return never describes missing projection history as no recorded change", async ({
  page,
}) => {
  await installRoutes(page, { orientation: missingProjectionResponse() });
  await page.goto(`/continuities/${continuityId}/return`);
  await expect(page.getByText("projection unavailable", { exact: false })).toBeVisible();
  await expect(
    page.getByText("Recent recorded changes are unavailable", { exact: false }),
  ).toBeVisible();
  await expect(
    page.getByText("There is no recent meaningful change", { exact: false }),
  ).toHaveCount(0);
});

test("Continuity fact Lens leads to exact Correction review without mutating truth", async ({
  page,
}) => {
  let correctionBody: Record<string, unknown> | null = null;
  const action = correctionAction();
  await installRoutes(page, {
    actions: new Map([[action.id, action]]),
    onCorrection: async (route) => {
      correctionBody = route.request().postDataJSON() as Record<string, unknown>;
      await json(route, action, 201);
    },
  });
  await page.goto(`/continuities/${continuityId}/continuity`);
  await page.getByRole("link", { name: /The western signal is dim/ }).click();
  await expect(page.getByRole("heading", { name: "Why this is active" })).toBeVisible();
  await page.getByRole("link", { name: "Correct this fact" }).click();
  await expect(page).toHaveURL(
    new RegExp(`/continuities/${continuityId}/correction/${encodeURIComponent(factId)}`),
  );
  await page.getByLabel("Exact replacement statement").focus();
  await page.keyboard.press("Tab");
  await expect(page.getByLabel("Reason for this direct correction")).toBeFocused();
  await page.keyboard.press("Escape");
  await expect(page.getByRole("heading", { name: "Correct this fact" })).toBeVisible();
  await page.getByLabel("Exact replacement statement").fill("The western signal is steady.");
  await page
    .getByLabel("Reason for this direct correction")
    .fill("The keeper verified the lens reading.");
  await page.getByRole("button", { name: "Review exact correction" }).click();
  await expect(page.getByRole("heading", { name: "Action status" })).toBeVisible();
  await expect(page.getByText("Provisional — not current truth")).toBeVisible();
  expect(correctionBody).not.toBeNull();
  expect(correctionBody).toMatchObject({
    schemaVersion: 1,
    expectedHeadCommitId: initialHead,
    target: { type: "fact", id: factId },
    operation: "CORRECT_CONTINUITY",
    before: { statement: "The western signal is dim.", scope: "SHARED" },
    after: { statement: "The western signal is steady." },
    reason: "The keeper verified the lens reading.",
  });
  expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);
});

test("older participation and Correction pending Actions remain visible together", async ({
  page,
}) => {
  const participate = pendingAction(
    "40000000-0000-4000-8000-000000000041",
    "PARTICIPATE",
    "Inspect the western signal housing.",
    "ACKNOWLEDGED",
  );
  const correction = pendingAction(
    "40000000-0000-4000-8000-000000000042",
    "CORRECT_CONTINUITY",
    "Correct the western signal fact.",
    "AWAITING_CONFIRMATION",
  );
  const actions = new Map([
    [participate.id, participate],
    [correction.id, correction],
  ]);
  await installRoutes(page, {
    actions,
    history: [
      {
        id: participate.id,
        status: participate.status,
        intent: participate.intent,
        acknowledgedAt: now,
        committedAt: null,
        narrative: null,
      },
      {
        id: correction.id,
        status: correction.status,
        intent: correction.intent,
        acknowledgedAt: later,
        committedAt: null,
        narrative: null,
      },
    ],
  });
  await page.goto(`/continuities/${continuityId}/context`);
  await expect(page.getByText("2 Actions still need attention")).toBeVisible();
  await expect(
    page.getByText("Inspect the western signal housing.", { exact: true }),
  ).toBeVisible();
  await expect(page.getByText("Correct the western signal fact.", { exact: true })).toBeVisible();
  await expect(
    page.getByLabel("Pending work").getByRole("heading", { name: "Pending work" }),
  ).toBeVisible();
  expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);
});

test("a lost confirmation response reports an unknown outcome instead of false unchanged truth", async ({
  page,
}) => {
  const action = correctionAction();
  await installRoutes(page, {
    actions: new Map([[action.id, action]]),
    history: [
      {
        id: action.id,
        status: action.status,
        intent: action.intent,
        acknowledgedAt: now,
        committedAt: null,
        narrative: null,
      },
    ],
  });
  let confirmAttempted = false;
  await page.route(`**/v1/actions/${action.id}/confirm`, async (route) => {
    confirmAttempted = true;
    await route.abort("connectionreset");
  });
  await page.goto(`/continuities/${continuityId}/actions/${action.id}`);
  await page.getByRole("button", { name: "Confirm this exact change" }).click();
  await expect(page.getByRole("alert")).toContainText("confirmation outcome is unknown");
  await expect(page.getByRole("alert")).not.toContainText("truth is unchanged");
  expect(confirmAttempted).toBe(true);
});

test("repeated same-status Action events do not reopen the SSE subscription", async ({ page }) => {
  const action = pendingAction(
    "40000000-0000-4000-8000-000000000051",
    "PARTICIPATE",
    "Inspect the western signal housing.",
    "ACKNOWLEDGED",
  );
  await installCountingEventSource(page);
  await installRoutes(page, {
    actions: new Map([[action.id, action]]),
    history: [
      {
        id: action.id,
        status: action.status,
        intent: action.intent,
        acknowledgedAt: now,
        committedAt: null,
        narrative: null,
      },
    ],
  });
  await page.goto(`/continuities/${continuityId}/context`);
  await expect(
    page.getByText("Inspect the western signal housing.", { exact: true }),
  ).toBeVisible();
  await expect
    .poll(() =>
      page.evaluate(
        () =>
          (window as unknown as { __simuloraEventSourceStats: { statusEvents: number } })
            .__simuloraEventSourceStats.statusEvents,
      ),
    )
    .toBeGreaterThan(0);
  await page.waitForTimeout(2_200);
  const stats = await page.evaluate(
    () =>
      (
        window as unknown as {
          __simuloraEventSourceStats: { connections: number; statusEvents: number };
        }
      ).__simuloraEventSourceStats,
  );
  expect(stats.statusEvents).toBeGreaterThan(0);
  // React StrictMode intentionally mounts this effect twice in development; a stable
  // subscription has no reopen after that baseline, even as polling replays this status.
  expect(stats.connections).toBeLessThanOrEqual(2);
});

test("Action detail does not spin an immediate GET loop for an unchanged status", async ({
  page,
}) => {
  const action = pendingAction(
    "40000000-0000-4000-8000-000000000061",
    "PARTICIPATE",
    "Inspect the Action detail request cadence.",
    "ACKNOWLEDGED",
  );
  await installRoutes(page, {
    actions: new Map([[action.id, action]]),
    history: [
      {
        id: action.id,
        status: action.status,
        intent: action.intent,
        acknowledgedAt: now,
        committedAt: null,
        narrative: null,
      },
    ],
  });
  let detailReads = 0;
  await page.route(`**/v1/actions/${action.id}`, async (route) => {
    detailReads += 1;
    await json(route, action);
  });

  await page.goto(`/continuities/${continuityId}/actions/${action.id}`);
  await expect(page.getByRole("heading", { name: "Action status" })).toBeVisible();
  await page.waitForTimeout(300);
  expect(detailReads).toBeLessThanOrEqual(4);
  await page.waitForTimeout(1_100);
  expect(detailReads).toBeLessThanOrEqual(6);
});
