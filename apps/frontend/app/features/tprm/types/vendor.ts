import { z } from "zod";

export const vendorSchema = z.object({
    id: z.string().uuid().optional(),
    name: z.string().min(2, "Name is required"),
    description: z.string().optional().default(""),
    website: z.string().url("Must be a valid URL").optional().or(z.literal("")),
    risk_level: z.enum(["low", "medium", "high", "critical"]).default("medium"),
    compliance_status: z.enum(["compliant", "under_review", "non_compliant"]).default("under_review"),
    active: z.boolean().default(true),
    requires_dpa: z.boolean().optional().default(false),
    requires_assessment: z.boolean().optional().default(false),
    created_at: z.string().optional(),
    updated_at: z.string().optional(),
});

export type VendorType = z.infer<typeof vendorSchema>;

export interface Vendor extends VendorType { }
