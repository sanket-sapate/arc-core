import { z } from "zod";

export const breachSchema = z.object({
    id: z.string().uuid(),
    organization_id: z.string().uuid(),
    title: z.string(),
    severity: z.string(),
    status: z.string(),
    incident_date: z.string().nullable().optional(),
    description: z.string().nullable().optional(),
    remediation_plan: z.string().nullable().optional(),
    created_at: z.string(),
    updated_at: z.string(),
});

export type Breach = z.infer<typeof breachSchema>;

export const createBreachSchema = z.object({
    title: z.string().min(1, "Title is required"),
    severity: z.string().min(1, "Severity is required"),
    status: z.string().min(1, "Status is required"),
    incident_date: z.string().optional(),
    description: z.string().optional(),
    remediation_plan: z.string().optional(),
});

export type CreateBreachData = z.infer<typeof createBreachSchema>;
export type UpdateBreachData = Partial<CreateBreachData>;
