import { z } from "@gorth/structure/cores/zod";
import { skinTable } from "@/database/schema";
export const skinInputSchema = z.object({
  name: z.string().trim().min(1).max(80),
  model: z.enum(["classic", "slim"]),
});
export const skinIdSchema = z.uuid();
export const skinSelection = {
  id: skinTable.id,
  name: skinTable.name,
  model: skinTable.model,
  isActive: skinTable.isActive,
  checksum: skinTable.checksum,
  createdAt: skinTable.createdAt,
};
export interface SkinSummary {
  id: string;
  name: string;
  model: "classic" | "slim";
  isActive: boolean;
  checksum: string;
  createdAt: string;
}
