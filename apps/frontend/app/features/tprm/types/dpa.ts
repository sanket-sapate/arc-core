import { z } from "zod";

export const dpaSchema = z.object({
    id: z.string().uuid().optional(),
    vendor_id: z.string().uuid("Vendor must be selected"),
    status: z.enum(["draft", "sent", "signed", "expired"]).default("draft"),
    effective_date: z.string().optional(),
    notes: z.string().optional().default(""),
    created_at: z.string().optional(),
    updated_at: z.string().optional(),
});

export type DpaType = z.infer<typeof dpaSchema>;

export interface Dpa extends DpaType { }
