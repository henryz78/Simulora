// IP-9.3 model-profile evaluation. Replay mode scripts every provider answer and
// runs in CI. Live mode sends the fixed corpus to a configured provider and is
// only for a profile whose retention/training terms have a recorded approval.
import { randomUUID } from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { compileActionGenerationContext } from "../packages/database/src/index.js";
import { createInitialState } from "../packages/domain/src/index.js";
import {
  compileWorldTurnPrompt,
  createModelGateway,
  livePromptVersion,
  OpenAICompatibleModelGateway,
  type ModelGatewayPort,
  type WorldTurnRequest,
} from "../packages/model-gateway/src/index.js";
import {
  evaluateModelOutput,
  evaluationRoutinePolicy,
  modelEvaluationCases,
  modelEvaluationWorld,
  type CaseEvaluation,
  type ModelEvaluationCase,
} from "../packages/testkit/src/model-evaluation.js";

export type ModelEvaluationReport = {
  mode: "replay" | "live";
  profile: { id: string; version: string; promptVersion: number };
  cases: CaseEvaluation[];
  /** Per category, never merged into one score. */
  categories: Record<string, { accepted: number; rejected: number }>;
  hardGateFailures: Array<{ caseId: string; gate: string }>;
  unmetExpectations: string[];
  /**
   * Live mode only: benign cases the provider did not answer acceptably, and any
   * case lost to an outage. Rejections alone cannot pass a live profile.
   */
  liveFailures: string[];
  passed: boolean;
};

const participation = { initiativeMode: "GUIDED", structureMode: "OPEN_ENDED" } as const;

function requestFor(evaluationCase: ModelEvaluationCase): WorldTurnRequest {
  const state = createInitialState(modelEvaluationWorld, participation);
  const context = compileActionGenerationContext(modelEvaluationWorld, state);
  if (!context) throw new Error("Evaluation world has no generator-eligible fact");
  return {
    actionId: randomUUID(),
    expectedHeadCommitId: randomUUID(),
    intent: evaluationCase.intent,
    requestedEffect: evaluationCase.requestedEffect,
    ...(evaluationCase.requestedEffect === "ROUTINE_EFFECT"
      ? { routineRoutes: evaluationRoutinePolicy.routes.map((route) => ({ ...route })) }
      : {}),
    participation: context.participation,
    character: context.character,
    targetFact: context.targetFact,
  };
}

/** A provider double that answers each request with the case's scripted output. */
function replayGateway(answer: (request: WorldTurnRequest) => unknown): ModelGatewayPort {
  return new OpenAICompatibleModelGateway({
    profile: {
      id: "replay",
      version: "1",
      adapter: "openai-compatible",
      model: "replay-model",
      promptVersion: livePromptVersion,
      timeoutMs: 5000,
      maxOutputTokens: 2048,
      retentionApprovalRef: null,
    },
    endpoint: "http://127.0.0.1:9/v1/chat/completions",
    apiKey: "replay-key-not-a-secret",
    fetch: (_input, init) => {
      const body = JSON.parse(init?.body as string) as {
        messages: Array<{ content: string }>;
      };
      const data = JSON.parse(body.messages[1]!.content) as {
        compiledGenerationRequest: WorldTurnRequest;
      };
      const content = answer(data.compiledGenerationRequest);
      return Promise.resolve(
        Response.json({
          model: "replay-model",
          choices: [
            {
              message: {
                content: typeof content === "string" ? content : JSON.stringify(content),
              },
            },
          ],
        }),
      );
    },
  });
}

export async function runModelEvaluation(
  mode: "replay" | "live",
  liveGateway?: ModelGatewayPort,
): Promise<ModelEvaluationReport> {
  const cases: CaseEvaluation[] = [];
  for (const evaluationCase of modelEvaluationCases) {
    const request = requestFor(evaluationCase);
    const gateway =
      mode === "live"
        ? liveGateway!
        : replayGateway((sent) =>
            evaluationCase.replay({
              ...sent,
              requestedEffect: evaluationCase.requestedEffect,
              character: sent.character ?? null,
            }),
          );
    let output: unknown;
    try {
      output = (await gateway.generateWorldTurn(request)).candidate;
    } catch (error) {
      output = error instanceof Error ? error : new Error("Unknown provider failure");
    }
    const state = createInitialState(modelEvaluationWorld, participation);
    cases.push(
      evaluateModelOutput({
        evaluationCase,
        request: {
          ...request,
          requestedEffect: evaluationCase.requestedEffect,
          character: request.character ?? null,
        },
        state,
        prompt: compileWorldTurnPrompt(request),
        output,
        userRoleName: modelEvaluationWorld.userRole.name,
        authorizedFactIds: [
          request.targetFact.id,
          ...(request.character?.knownFacts.map((fact) => fact.id) ?? []),
        ],
      }),
    );
  }
  const categories: ModelEvaluationReport["categories"] = {};
  for (const result of cases) {
    const bucket = (categories[result.category] ??= { accepted: 0, rejected: 0 });
    bucket[result.outcome === "ACCEPTED" ? "accepted" : "rejected"] += 1;
  }
  const hardGateFailures = cases.flatMap((result) =>
    result.hardGates
      .filter((gate) => !gate.passed)
      .map((gate) => ({ caseId: result.caseId, gate: gate.gate })),
  );
  const unmetExpectations =
    mode === "replay" ? cases.filter((result) => !result.expectationMet).map((r) => r.caseId) : [];
  const liveFailures =
    mode === "live"
      ? cases
          .filter(
            (result) =>
              (result.category === "benign" && result.outcome !== "ACCEPTED") ||
              result.rejection === "ProviderUnavailableError",
          )
          .map((result) => result.caseId)
      : [];
  const profile = mode === "live" ? liveGateway!.profile : { id: "replay", version: "1" };
  return {
    mode,
    profile: { id: profile.id, version: profile.version, promptVersion: livePromptVersion },
    cases,
    categories,
    hardGateFailures,
    unmetExpectations,
    liveFailures,
    passed:
      hardGateFailures.length === 0 && unmetExpectations.length === 0 && liveFailures.length === 0,
  };
}

async function main(): Promise<void> {
  const live = process.argv.includes("--live");
  let liveGateway: ModelGatewayPort | undefined;
  if (live) {
    const approval = process.env.SIMULORA_MODEL_RETENTION_APPROVAL_REF;
    const endpoint = process.env.SIMULORA_MODEL_ENDPOINT;
    const model = process.env.SIMULORA_MODEL_NAME;
    const apiKey = process.env.SIMULORA_MODEL_API_KEY;
    // Sending the corpus to a real provider is itself a data flow that needs approval.
    if (!approval) throw new Error("Live evaluation needs SIMULORA_MODEL_RETENTION_APPROVAL_REF");
    if (!endpoint || !model || !apiKey) throw new Error("Live evaluation needs a model profile");
    liveGateway = createModelGateway({
      adapter: "openai-compatible",
      endpoint,
      model,
      apiKey,
      profileId: process.env.SIMULORA_MODEL_PROFILE_ID ?? "live-primary",
      profileVersion: process.env.SIMULORA_MODEL_PROFILE_VERSION ?? "1",
      timeoutMs: 60_000,
      maxOutputTokens: 2048,
      fallback: "none",
      retentionApprovalRef: approval,
    });
  }
  const report = await runModelEvaluation(live ? "live" : "replay", liveGateway);
  const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
  const directory = path.join(root, ".local-data", "model-evaluation");
  await mkdir(directory, { recursive: true });
  const file = path.join(directory, `${report.mode}-${Date.now()}.json`);
  await writeFile(file, JSON.stringify(report, null, 2));
  console.log(JSON.stringify({ file, ...report, cases: undefined }, null, 2));
  if (!report.passed) process.exitCode = 1;
}

if (process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1])) {
  await main();
}
