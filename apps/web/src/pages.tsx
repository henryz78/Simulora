import { useState, type ReactElement } from "react";
import { Link } from "react-router";
import { FoundationButton } from "@simulora/ui";

const foundations = [
  ["Web", "Responsive React composition root"],
  ["API", "Versioned JSON and health boundary"],
  ["Worker", "Independent idle process with deterministic adapters"],
  ["Data", "PostgreSQL migration contract and S3-compatible local seam"],
] as const;

export function FoundationPage(): ReactElement {
  const [detailsVisible, setDetailsVisible] = useState(false);

  return (
    <div className="app-shell">
      <header className="site-header">
        <Link className="wordmark" to="/" aria-label="Simulora engineering foundation home">
          <span className="wordmark-mark" aria-hidden="true">
            S
          </span>
          <span>Simulora</span>
        </Link>
        <span className="phase-badge">IP-1 Foundation</span>
      </header>

      <main id="main-content" className="foundation-main">
        <section className="hero" aria-labelledby="foundation-title">
          <p className="eyebrow">Production engineering foundation</p>
          <h1 id="foundation-title">The structure is ready. Product semantics have not started.</h1>
          <p className="hero-copy">
            This production shell verifies responsive delivery, accessible interaction, runtime
            boundaries and infrastructure contracts without implementing World, Continuity or Action
            behavior.
          </p>
          <FoundationButton
            className="primary-action"
            aria-expanded={detailsVisible}
            aria-controls="foundation-details"
            onClick={() => setDetailsVisible((visible) => !visible)}
          >
            {detailsVisible ? "Hide foundation boundaries" : "Review foundation boundaries"}
          </FoundationButton>
        </section>

        <section className="foundation-grid" aria-label="Engineering foundation boundaries">
          {foundations.map(([title, copy]) => (
            <article className="foundation-card" key={title}>
              <h2>{title}</h2>
              <p>{copy}</p>
            </article>
          ))}
        </section>

        <section
          id="foundation-details"
          className="boundary-panel"
          hidden={!detailsVisible}
          aria-live="polite"
        >
          <h2>Current boundary</h2>
          <ul>
            <li>No World or Continuity domain implementation.</li>
            <li>No Action lifecycle, live model provider or deployment.</li>
            <li>No dependency on the frozen clickable Prototype.</li>
          </ul>
        </section>
      </main>

      <footer className="site-footer">Product Implementation · IP-1 only</footer>
    </div>
  );
}

export function NotFoundPage(): ReactElement {
  return (
    <main className="not-found">
      <h1>Foundation route not found</h1>
      <p>No product route has been implemented in IP-1.</p>
      <Link to="/">Return to foundation</Link>
    </main>
  );
}
