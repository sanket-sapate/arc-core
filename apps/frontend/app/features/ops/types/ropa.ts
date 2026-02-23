import { z } from "zod";

export const ropaSchema = z.object({
    id: z.string().uuid().optional(),
    name: z.string().min(2, "Name is required"),
    processing_activity: z.string().min(1, "Processing activity description is required"),
    legal_basis: z.string().min(1, "Legal basis is required"),
    data_categories: z.array(z.string()).default([]),
    status: z.enum(["active", "archived", "draft"]).default("draft"),
    created_at: z.string().optional(),
    updated_at: z.string().optional(),
});

export type ROPA = z.infer<typeof ropaSchema>;
