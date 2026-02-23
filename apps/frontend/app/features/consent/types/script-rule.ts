import { z } from "zod";

export const scriptRuleSchema = z.object({
    id: z.string().uuid(),
    tenant_id: z.string().uuid(),
    purpose_id: z.string().uuid(),
    name: z.string().min(1, "Name is required"),
    script_domain: z.string().min(1, "Script Domain is required"),
    rule_type: z.enum(["regex", "exact", "contains"]),
    active: z.boolean(),
    created_at: z.string().datetime(),
    updated_at: z.string().datetime(),
});

export type ScriptRule = z.infer<typeof scriptRuleSchema>;

export const createScriptRuleSchema = scriptRuleSchema.omit({
    id: true,
    tenant_id: true,
    created_at: true,
    updated_at: true,
});

export type CreateScriptRuleInput = z.infer<typeof createScriptRuleSchema>;

export const updateScriptRuleSchema = createScriptRuleSchema.partial();

export type UpdateScriptRuleInput = z.infer<typeof updateScriptRuleSchema>;
