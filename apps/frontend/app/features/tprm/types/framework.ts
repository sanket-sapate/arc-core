import { z } from "zod";

export const frameworkSchema = z.object({
    id: z.string().uuid().optional(),
    name: z.string().min(2, "Name is required"),
    version: z.string().min(1, "Version is required"),
    description: z.string().optional(),
    created_at: z.string().optional(),
    updated_at: z.string().optional(),
});

export type Framework = z.infer<typeof frameworkSchema>;

export const frameworkQuestionSchema = z.object({
    id: z.string().uuid().optional(),
    framework_id: z.string().uuid(),
    question_text: z.string().min(5, "Question text required"),
    question_type: z.enum(["text", "boolean", "multiple_choice"]).default("text"),
    options: z.record(z.string(), z.any()).optional().nullable(),
    created_at: z.string().optional(),
});

export type FrameworkQuestion = z.infer<typeof frameworkQuestionSchema>;
