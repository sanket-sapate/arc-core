import { z } from "zod";

export const dsrSchema = z.object({
    id: z.string().uuid(),
    organization_id: z.string().uuid(),
    type: z.string(),
    status: z.string(),
    requester_email: z.string().email().optional().nullable(),
    requester_name: z.string().optional().nullable(),
    description: z.string().optional().nullable(),
    resolution: z.string().optional().nullable(),
    due_date: z.string().optional().nullable(),
    created_at: z.string(),
    updated_at: z.string(),
});

export type PrivacyRequest = z.infer<typeof dsrSchema>;

export const createDsrSchema = z.object({
    type: z.string().min(1, "Request type is required"),
    requester_email: z.string().email("Invalid email address"),
    requester_name: z.string().min(1, "Name is required"),
    description: z.string().min(1, "Description is required"),
});

export type CreatePrivacyRequestData = z.infer<typeof createDsrSchema>;

export const updateDsrStatusSchema = z.object({
    status: z.string(),
    resolution: z.string().optional(),
    due_date: z.string().optional().nullable(),
});

export type UpdatePrivacyRequestStatusData = z.infer<typeof updateDsrStatusSchema>;
