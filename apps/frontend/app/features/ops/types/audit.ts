import { z } from "zod";

export const auditLogSchema = z.object({
    id: z.string().uuid(),
    organization_id: z.string().uuid(),
    action: z.string(),
    actor_email: z.string().nullable().optional(),
    target_entity: z.string().nullable().optional(),
    target_id: z.string().nullable().optional(),
    timestamp: z.string(),
});

export type PrivacyAuditLog = z.infer<typeof auditLogSchema>;
