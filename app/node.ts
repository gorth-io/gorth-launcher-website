import { serve } from "@gorth/principle/cores/hono/server";
import { appUrl, port } from "@/utils/environment";
import { createNodeApp } from "@/app/node-app";

const configuredPort = Number(
  port || (appUrl ? new URL(appUrl).port : "") || 5504,
);
if (
  !Number.isInteger(configuredPort) ||
  configuredPort < 1 ||
  configuredPort > 65535
)
  throw new Error("Invalid application port");
serve({ fetch: createNodeApp().fetch, port: configuredPort });
