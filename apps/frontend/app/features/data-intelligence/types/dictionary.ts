import { z } from "zod";

// ── Zod Schema ─────────────────────────────────────────────────────────────

export const dictionaryItemSchema = z.object({
    name: z.string().min(2, "Name must be at least 2 characters"),
    category: z.string().min(2, "Category is required"),
    sensitivity: z.enum(["low", "medium", "high", "critical"]),
    active: z.boolean(),
});

// ── TypeScript Types ───────────────────────────────────────────────────────

/** Form values (what the form fields produce). */
export type DictionaryItemFormValues = z.infer<typeof dictionaryItemSchema>;

/** Full API response shape (includes server-generated fields). */
export interface DictionaryItem extends DictionaryItemFormValues {
    id: string;
    createdAt?: string;
    updatedAt?: string;
    thirdPartyRuleId?: string | null;
}
