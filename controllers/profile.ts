import "server-only";
import type { Context } from "hono";
import type { ApiEnv } from "@/utils/interface";
import { readJson } from "@/lib/http/request";
import {
  profileUpdateSchema,
  friendshipInputSchema,
  friendshipActionSchema,
} from "@/schemas/profile";
import {
  getProfile as getProfileServices,
  updateProfile as updateProfileServices,
  listFriends as listFriendsServices,
  requestFriend as requestFriendServices,
  changeFriend as changeFriendServices,
} from "@/services/profile-store";
export async function getProfile(context: Context<ApiEnv>) {
  return context.json(await getProfileServices(context.get("user").id), 200);
}
export async function updateProfile(context: Context<ApiEnv>) {
  const input = profileUpdateSchema.parse(
    await readJson(context.req.raw, 2048),
  );
  return context.json(
    await updateProfileServices(context.get("user").id, input),
    200,
  );
}
export async function listFriends(context: Context<ApiEnv>) {
  return context.json(
    { items: await listFriendsServices(context.get("user").id) },
    200,
  );
}
export async function requestFriend(context: Context<ApiEnv>) {
  const input = friendshipInputSchema.parse(
    await readJson(context.req.raw, 512),
  );
  await requestFriendServices(context.get("user").id, input.name);
  return context.body(null, 201);
}
export async function changeFriend(context: Context<ApiEnv>) {
  const input = friendshipActionSchema.parse(
    await readJson(context.req.raw, 512),
  );
  await changeFriendServices(context.get("user").id, input.id, input.action);
  return context.body(null, 204);
}
