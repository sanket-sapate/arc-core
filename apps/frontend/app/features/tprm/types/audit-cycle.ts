import { z } from "zod";

export const auditCycleSchema = z.object({
    id: z.string().uuid().optional(),
    name: z.string().min(2, "Sequence name required"),
    status: z.enum(["planned", "active", "closed"]).default("planned"),
    start_date: z.string().optional().nullable(),
    end_date: z.string().optional().nullable(),
    created_at: z.string().optional(),
    updated_at: z.string().optional(),
});

export type AuditCycle = z.infer<typeof auditCycleSchema>;
