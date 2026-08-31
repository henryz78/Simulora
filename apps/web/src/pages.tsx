import { useEffect, useState, type ReactElement } from "react";
import { Link, useParams } from "react-router";
import {
  authoritativeStateResponseSchema,
  type AuthoritativeStateResponse,
} from "@simulora/contracts";

type LoadState =
  | { status: "loading" }
  | { status: "ready"; data: AuthoritativeStateResponse }
  | { status: "not-found" }
  | { status: "error" };

async function readWorldState(continuityId: string | undefined): Promise<LoadState> {
  if (!continuityId) return { status: "not-found" };
  try {
    const response = await fetch(`/v1/continuities/${encodeURIComponent(continuityId)}/state`, {
      headers: { accept: "application/json" },
    });
    if (response.status === 404) return { status: "not-found" };
    if (!response.ok) throw new Error("state request failed");
    return {
      status: "ready",
      data: authoritativeStateResponseSchema.parse(await response.json()),
    };
  } catch {
    return { status: "error" };
  }
}

export function FoundationPage(): ReactElement {
  return (
    <div className="app-shell">
      <header className="site-header">
        <Link className="wordmark" to="/" aria-label="Simulora home">
          <span className="wordmark-mark" aria-hidden="true">
            S
          </span>
          <span>Simulora</span>
        </Link>
        <span className="phase-badge">IP-2 · Authoritative spine</span>
      </header>
      <main id="main-content" className="foundation-main">
        <section className="hero" aria-labelledby="foundation-title">
          <p className="eyebrow">Production implementation</p>
          <h1 id="foundation-title">A durable world begins with a known source of truth.</h1>
          <p className="hero-copy">
            IP-2 establishes structured World Drafts, immutable playable revisions and Continuities
            whose current state is read from PostgreSQL. Action, generation and recovery are not yet
            available.
          </p>
        </section>
        <section className="boundary-panel" aria-labelledby="current-boundary">
          <h2 id="current-boundary">Current implementation boundary</h2>
          <ul>
            <li>World and current Continuity state are server-authoritative.</li>
            <li>Existing Continuities remain pinned to their starting World Revision.</li>
            <li>No Action Truth, model generation, Recovery or World Studio behavior yet.</li>
          </ul>
        </section>
      </main>
      <footer className="site-footer">Product Implementation · IP-2 only</footer>
    </div>
  );
}

export function WorldPage(): ReactElement {
  const { continuityId } = useParams<{ continuityId: string }>();
  const [loadState, setLoadState] = useState<LoadState>({ status: "loading" });

  useEffect(() => {
    void readWorldState(continuityId).then(setLoadState);
  }, [continuityId]);

  const retry = (): void => {
    setLoadState({ status: "loading" });
    void readWorldState(continuityId).then(setLoadState);
  };

  if (loadState.status === "loading") {
    return (
      <StatusPage
        title="Opening this world…"
        copy="Reading the current Branch head from the authoritative service."
      />
    );
  }
  if (loadState.status === "not-found") {
    return (
      <StatusPage
        title="This Continuity is not available"
        copy="It may not exist or may not be available to this account."
      />
    );
  }
  if (loadState.status === "error") {
    return (
      <StatusPage
        title="The current world could not be read"
        copy="Nothing has been inferred or replaced locally."
      >
        <button className="primary-action" type="button" onClick={retry}>
          Try again
        </button>
      </StatusPage>
    );
  }

  const { data } = loadState;
  return (
    <div className="world-shell">
      <header className="world-header">
        <Link className="wordmark" to="/" aria-label="Simulora home">
          <span className="wordmark-mark" aria-hidden="true">
            S
          </span>
          <span>Simulora</span>
        </Link>
        <div
          className="source-chip"
          aria-label={`World revision ${data.continuity.worldRevisionNumber}`}
        >
          Revision {data.continuity.worldRevisionNumber} · current path
        </div>
      </header>

      <main className="world-main">
        <section className="world-scene" aria-labelledby="world-title">
          <p className="eyebrow">{data.world.userRole.name}</p>
          <h1 id="world-title">{data.world.title}</h1>
          <p className="world-premise">{data.world.premise}</p>
          <div className="situation-card">
            <p className="card-label">Current situation</p>
            <p>{data.state.openThreads[0] ?? data.world.startingSituation}</p>
          </div>
        </section>

        <aside className="world-context" aria-label="Current world context">
          <section>
            <h2>What is true now</h2>
            <ul className="truth-list">
              {data.state.facts.map((fact) => {
                const item = fact as { id: string; statement: string };
                return <li key={item.id}>{item.statement}</li>;
              })}
            </ul>
          </section>
          <section>
            <h2>Present here</h2>
            {data.state.characters.map((character) => {
              const item = character as {
                id: string;
                name: string;
                role: string;
                currentState: string;
              };
              return (
                <article className="character-card" key={item.id}>
                  <strong>{item.name}</strong>
                  <span>{item.role}</span>
                  <small>{item.currentState}</small>
                </article>
              );
            })}
          </section>
          <section className="authority-note">
            <h2>Participation</h2>
            <p>
              {labelMode(data.state.participation.initiativeMode)} ·{" "}
              {labelMode(data.state.participation.structureMode)}
            </p>
            <small>Read-only in IP-2. No model or client state can advance this world.</small>
          </section>
        </aside>
      </main>
    </div>
  );
}

function labelMode(value: string): string {
  return value
    .toLowerCase()
    .replaceAll("_", " ")
    .replace(/^./, (letter) => letter.toUpperCase());
}

function StatusPage({
  title,
  copy,
  children,
}: {
  title: string;
  copy: string;
  children?: ReactElement;
}): ReactElement {
  return (
    <main className="status-page" aria-live="polite">
      <p className="eyebrow">Simulora</p>
      <h1>{title}</h1>
      <p>{copy}</p>
      {children}
      <Link to="/">Return home</Link>
    </main>
  );
}

export function NotFoundPage(): ReactElement {
  return (
    <StatusPage title="Route not found" copy="This production route has not been implemented." />
  );
}
