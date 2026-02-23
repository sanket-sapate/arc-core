import { z } from "zod";

export const consentFormSchema = z.object({
    id: z.string().uuid().optional(),
    name: z.string().min(2, "Name is required"),
    description: z.string().optional().default(""),
    active: z.boolean().default(true),
    purpose_ids: z.array(z.string().uuid()).default([]),
    created_at: z.string().optional(),
    updated_at: z.string().optional(),
});

export type ConsentFormType = z.infer<typeof consentFormSchema>;

export interface ConsentForm extends ConsentFormType { }
