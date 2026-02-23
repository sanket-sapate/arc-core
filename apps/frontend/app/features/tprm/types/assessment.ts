import { z } from "zod";

export const assessmentSchema = z.object({
    id: z.string().uuid().optional(),
    vendor_id: z.string().uuid("Vendor ID is required"),
    framework_id: z.string().uuid("Framework ID is required"),
    audit_cycle_id: z.string().uuid().optional().nullable(),
    status: z.enum(["draft", "in_progress", "under_review", "completed"]).default("draft"),
    score: z.number().optional().nullable(),
    created_at: z.string().optional(),
    updated_at: z.string().optional(),
});

export type Assessment = z.infer<typeof assessmentSchema>;

export const assessmentAnswerSchema = z.object({
    id: z.string().uuid().optional(),
    assessment_id: z.string().uuid(),
    question_id: z.string().uuid(),
    answer_text: z.string().optional().nullable(),
    answer_options: z.record(z.string(), z.any()).optional().nullable(),
});

export type AssessmentAnswer = z.infer<typeof assessmentAnswerSchema>;
