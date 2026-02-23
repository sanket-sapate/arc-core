import { z } from "zod";

export const grievanceSchema = z.object({
    id: z.string().uuid(),
    organization_id: z.string().uuid(),
    reporter_email: z.string().email().optional().nullable(),
    issue_type: z.string(),
    description: z.string().optional().nullable(),
    status: z.string(),
    priority: z.string(),
    resolution: z.string().optional().nullable(),
    created_at: z.string(),
    updated_at: z.string(),
});

export type Grievance = z.infer<typeof grievanceSchema>;

export const createGrievanceSchema = z.object({
    reporter_email: z.string().email("Invalid email address"),
    issue_type: z.string().min(1, "Issue type is required"),
    description: z.string().min(1, "Description is required"),
    priority: z.string().optional(),
});

export type CreateGrievanceData = z.infer<typeof createGrievanceSchema>;

export const updateGrievanceStatusSchema = z.object({
    status: z.string(),
    resolution: z.string().optional(),
    priority: z.string().optional(),
});

export type UpdateGrievanceStatusData = z.infer<typeof updateGrievanceStatusSchema>;
