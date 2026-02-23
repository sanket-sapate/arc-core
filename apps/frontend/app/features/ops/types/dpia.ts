import { z } from "zod";

export const dpiaSchema = z.object({
    id: z.string().uuid().optional(),
    name: z.string().min(2, "Name is required"),
    vendor_id: z.string().uuid().optional().nullable(),
    status: z.enum(["draft", "in_progress", "under_review", "approved", "rejected"]).default("draft"),
    risk_level: z.enum(["low", "medium", "high", "critical"]).default("medium"),
    form_data: z.record(z.string(), z.any()).optional().nullable(),
    created_at: z.string().optional(),
    updated_at: z.string().optional(),
});

export type DPIA = z.infer<typeof dpiaSchema>;
