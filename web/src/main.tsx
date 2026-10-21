import { StrictMode, useEffect, useState } from "react";
import { createRoot } from "react-dom/client";
import { Admin } from "./Admin.tsx";
import { lang } from "./i18n.ts";
import { Play } from "./Play.tsx";
import { Create, Explore, Home, Mine, Privacy, SamplePage, SignIn } from "./Site.tsx";
import { Studio } from "./Studio.tsx";
import { World } from "./World.tsx";
import "./style.css";
import "./ui.tsx"; // sets the day or night look before the first paint

/**
 * Routes: #/ · #/explore[?q=&tag=] · #/explore/<sampleId> · #/create · #/me · #/world/<worldId> ·
 * #/studio/new[/manual] · #/studio/<worldId> · #/play/<saveId> · #/login · #/join[/<invite>] · #/privacy · #/admin
 */
function App() {
  const [hash, setHash] = useState(location.hash);
  useEffect(() => {
    const update = () => setHash(location.hash);
    addEventListener("hashchange", update);
    return () => removeEventListener("hashchange", update);
  }, []);
  const [path = "", query] = hash.replace(/^#/, "").split("?");
  const [, page, id = "", more] = path.split("/");
  if (page === "studio")
    return <Studio key={id + more} worldId={id === "new" ? null : id} manual={more === "manual"} />;
  if (page === "play") return <Play key={id} saveId={id} />;
  if (page === "world") return <World key={id} worldId={id} />;
  if (page === "explore") return id ? <SamplePage key={id} id={id} /> : <Explore query={new URLSearchParams(query)} />;
  if (page === "create") return <Create />;
  if (page === "login" || page === "join") return <SignIn key={page} join={page === "join"} invite={id} />;
  if (page === "privacy") return <Privacy />;
  if (page === "me") return <Mine />;
  if (page === "admin") return <Admin />;
  return <Home />;
}

document.documentElement.lang = lang === "zh" ? "zh-CN" : "en";
createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
