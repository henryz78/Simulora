import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { createBrowserRouter, RouterProvider } from "react-router";
import {
  ActionStatusPage,
  ContextPage,
  ContinuityPage,
  CorrectionReviewPage,
  FactLensPage,
  FoundationPage,
  NotFoundPage,
  ReturnPage,
  WorldPage,
} from "./pages.js";
import { ContinuityLayout } from "./continuity.js";
import "./styles.css";

const router = createBrowserRouter([
  { path: "/", element: <FoundationPage /> },
  {
    path: "/continuities/:continuityId",
    element: <ContinuityLayout />,
    children: [
      { index: true, element: <WorldPage /> },
      { path: "return", element: <ReturnPage /> },
      { path: "continuity", element: <ContinuityPage /> },
      { path: "continuity/facts/:factId", element: <FactLensPage /> },
      { path: "context", element: <ContextPage /> },
      { path: "correction/:targetId", element: <CorrectionReviewPage /> },
      { path: "actions/:actionId", element: <ActionStatusPage /> },
    ],
  },
  { path: "*", element: <NotFoundPage /> },
]);

const root = document.getElementById("root");
if (!root) throw new Error("Missing #root element");

createRoot(root).render(
  <StrictMode>
    <RouterProvider router={router} />
  </StrictMode>,
);
