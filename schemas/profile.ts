import { z } from "@gorth/structure/cores/zod";
export const minecraftNameSchema = z
  .string()
  .min(3)
  .max(16)
  .regex(/^[A-Za-z0-9_]{3,16}$/, "Use 3–16 letters, numbers or underscores.")
  .refine((value) => value === value.trim());
export const profilePreferencesSchema = z.object({
  language: z.enum(["en", "vi"]).default("en"),
  allowFriendRequests: z.boolean().default(true),
  friendNotifications: z.boolean().default(true),
  publicSkin: z.boolean().default(false),
});
export const profileUpdateSchema = z.discriminatedUnion("action", [
  z.object({ action: z.literal("name"), name: minecraftNameSchema }),
  z.object({
    action: z.literal("preferences"),
    preferences: profilePreferencesSchema,
  }),
]);
export const friendshipInputSchema = z.object({ name: minecraftNameSchema });
export const friendshipActionSchema = z.object({
  id: z.uuid(),
  action: z.enum(["accept", "remove"]),
});
export type ProfilePreferences = z.infer<typeof profilePreferencesSchema>;
export type ProfileUpdate = z.infer<typeof profileUpdateSchema>;
export interface MinecraftProfile {
  id: string;
  name: string;
  revision: number;
  texturePublic: boolean;
  updatedAt: string;
}
export interface UserProfileResponse {
  profile: MinecraftProfile | null;
  preferences: ProfilePreferences;
  signingReady: boolean;
}
export interface FriendRow {
  id: string;
  name: string;
  avatar: string | null;
  status: "requested" | "accepted";
  incoming: boolean;
  createdAt: string;
}
