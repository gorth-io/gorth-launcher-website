import type { IncomingMessage, ServerResponse } from "node:http";
import { getRequestListener } from "@gorth/principle/cores/hono/server";
import app from "@/app/server";

const listener = getRequestListener(app.fetch);
export default async function handler(
  request: IncomingMessage,
  response: ServerResponse,
) {
  // Native Node adapter preserves streaming bodies and multiple Set-Cookie headers.
  return await listener(request, response);
}
