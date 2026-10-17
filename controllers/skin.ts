import "server-only";
import type { Context } from "hono";
import { z } from "@gorth/structure/cores/zod";
import type { ApiEnv } from "@/utils/interface";
import { readBody, readJson, RequestError } from "@/lib/http/request";
import { skinIdSchema, skinInputSchema } from "@/schemas/skin";
import { normalizeSkin } from "@/lib/skin/png";
import {
  listSkins as listSkinsServices,
  saveSkin as saveSkinServices,
  deleteSkin as deleteSkinServices,
  activateSkin as activateSkinServices,
  getSkin as getSkinServices,
} from "@/services/skin-store";

export async function listSkins(context: Context<ApiEnv>) {
  const items = await listSkinsServices(context.get("user").id);
  return context.json({ items }, 200, { "Cache-Control": "no-store" });
}
export async function saveSkin(context: Context<ApiEnv>) {
  const contentType = context.req.header("content-type") ?? "";
  if (
    !contentType.startsWith("multipart/form-data;") ||
    contentType.length > 200
  )
    throw new RequestError(415, "Use a PNG upload form.");
  const bytes = await readBody(context.req.raw, 300 * 1024);
  let form: FormData;
  try {
    form = await new Response(new Uint8Array(bytes), {
      headers: { "Content-Type": contentType },
    }).formData();
  } catch {
    throw new RequestError(400, "Invalid upload form.");
  }
  const input = skinInputSchema.parse({
    name: form.get("name"),
    model: form.get("model"),
  });
  const file = form.get("file");
  if (!(file instanceof File) || file.type !== "image/png" || !file.size)
    throw new RequestError(400, "Choose a PNG skin.");
  const png = normalizeSkin(Buffer.from(await file.arrayBuffer()), input.model);
  const skin = await saveSkinServices(context.get("user").id, {
    ...input,
    ...png,
  });
  return context.json({ skin }, 201, { "Cache-Control": "no-store" });
}
export async function deleteSkin(context: Context<ApiEnv>) {
  const id = skinIdSchema.parse(context.req.query("id"));
  await deleteSkinServices(context.get("user").id, id);
  return context.body(null, 204);
}
export async function getActiveSkin(context: Context<ApiEnv>) {
  const skin =
    (await listSkinsServices(context.get("user").id)).find(
      (item) => item.isActive,
    ) ?? null;
  return context.json({ skin }, 200, { "Cache-Control": "no-store" });
}
export async function activateSkin(context: Context<ApiEnv>) {
  const { id } = z
    .object({ id: skinIdSchema })
    .parse(await readJson(context.req.raw, 1024));
  await activateSkinServices(context.get("user").id, id);
  return context.body(null, 204);
}
export async function getSkin(context: Context<ApiEnv>) {
  const id = skinIdSchema.parse(context.req.query("id"));
  const skin = await getSkinServices(context.get("user").id, id);
  const disposition =
    context.req.query("preview") === "1" ? "inline" : "attachment";
  return context.body(
    new Uint8Array(Buffer.from(skin.pngBase64, "base64")),
    200,
    {
      "Content-Type": "image/png",
      "Cache-Control": "private, no-store",
      "Content-Disposition":
        disposition + '; filename="gorth-skin-' + skin.id + '.png"',
      "X-Content-Type-Options": "nosniff",
      "Content-Security-Policy": "default-src 'none'",
    },
  );
}
