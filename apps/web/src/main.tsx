import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { createBrowserRouter, RouterProvider } from "react-router";
import { FoundationPage, NotFoundPage, WorldPage } from "./pages.js";
import "./styles.css";

const router = createBrowserRouter([
  { path: "/", element: <FoundationPage /> },
  { path: "/continuities/:continuityId", element: <WorldPage /> },
  { path: "*", element: <NotFoundPage /> },
]);

const root = document.getElementById("root");
if (!root) throw new Error("Missing #root element");

createRoot(root).render(
  <StrictMode>
    <RouterProvider router={router} />
  </StrictMode>,
);
