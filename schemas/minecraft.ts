import { z } from "@gorth/structure/cores/zod";
import { minecraftNameSchema } from "@/schemas/profile";
export const gameTokenSchema = z
  .string()
  .length(43)
  .regex(/^[A-Za-z0-9_-]{43}$/);
export const gameUuidSchema = z
  .string()
  .length(32)
  .regex(/^[a-fA-F0-9]{32}$/);
export const issueGameSessionSchema = z.object({
  clientToken: z.string().min(1).max(128),
});
export const gameTokenInputSchema = z.object({
  accessToken: gameTokenSchema,
  clientToken: z.string().max(128).optional(),
  selectedProfile: z
    .object({ id: gameUuidSchema, name: minecraftNameSchema })
    .optional(),
});
const serverIdSchema = z
  .string()
  .min(1)
  .max(41)
  .regex(/^-?[a-fA-F0-9]{1,40}$/)
  .refine((value) => value === value.trim());
export const gameJoinSchema = z.object({
  accessToken: gameTokenSchema,
  selectedProfile: gameUuidSchema,
  serverId: serverIdSchema,
});
export const gameHasJoinedSchema = z.object({
  username: minecraftNameSchema,
  serverId: serverIdSchema,
  ip: z.string().max(64).optional(),
});
export const gameNamesSchema = z.array(minecraftNameSchema).min(1).max(100);
export interface GameSessionResponse {
  accessToken: string;
  clientToken: string;
  expiresAt: number;
  selectedProfile: { id: string; name: string };
  authlibRoot: string;
}
