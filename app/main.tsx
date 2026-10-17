import { createRoot } from "react-dom/client";
import { RouterProvider } from "@gorth/primitive/cores/tanstack/router";
import { ApplicationProvider } from "@/providers/application";
import { createAppRouter } from "@/app/router";
import "@/styles/globals.css";

const element = document.getElementById("root");
if (!element) throw new Error("Missing application root");
const router = createAppRouter();
createRoot(element).render(
  <ApplicationProvider>
    <RouterProvider router={router} />
  </ApplicationProvider>,
);
