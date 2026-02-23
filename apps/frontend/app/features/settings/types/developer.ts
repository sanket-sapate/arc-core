import { z } from "zod";

export const apiKeySchema = z.object({
    id: z.string().uuid(),
    name: z.string(),
    key_prefix: z.string(),
    expires_at: z.string().nullable().optional(),
    created_at: z.string(),
});

export type ApiKey = z.infer<typeof apiKeySchema>;

export const newApiKeyResponseSchema = z.object({
    id: z.string().uuid(),
    name: z.string(),
    key_prefix: z.string(),
    raw_key: z.string(),
    expires_at: z.string().nullable().optional(),
    created_at: z.string(),
});

export type NewApiKeyResponse = z.infer<typeof newApiKeyResponseSchema>;

export const createApiKeySchema = z.object({
    name: z.string().min(1, "Name is required"),
    expires_in_days: z.number().int().min(0, "Expiration must be 0 or positive"),
});

export type CreateApiKeyData = z.infer<typeof createApiKeySchema>;
