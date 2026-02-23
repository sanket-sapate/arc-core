import { z } from "zod";

export const purposeSchema = z.object({
    id: z.string().uuid().optional(),
    name: z.string().min(2, "Name is required"),
    description: z.string().optional().default(""),
    legal_basis: z.enum(["consent", "legitimate_interest", "contract", "legal_obligation"]).default("consent"),
    active: z.boolean().default(true),
    data_objects: z.array(z.string()).optional(),
    data_objects_count: z.number().optional(),
    created_at: z.string().optional(),
    updated_at: z.string().optional(),
});

export type PurposeType = z.infer<typeof purposeSchema>;

export interface Purpose extends PurposeType { }
