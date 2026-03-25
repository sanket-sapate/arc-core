import { z } from "zod";

export const vendorSchema = z.object({
    id: z.string().uuid().optional(),
    name: z.string().min(2, "Name is required"),
    contact_email: z.string().email("Must be a valid email").optional().or(z.literal("")),
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

export interface DataDictionaryItem {
    id: string;
    name: string;
    sensitivity: string;
    active: boolean;
}

export interface SubProcessor {
    name: string;
    services_provided: string;
    location: string;
}

export const wizardFormSchema = z.object({
    // Step 1: Basic Info
    name: z.string().min(2, "Vendor name is required"),
    contact_email: z.string().email("Valid email is required"),
    requires_assessment: z.boolean().default(true),
    requires_dpa: z.boolean().default(true),
    // Step 2: Risk & Compliance
    risk_level: z.enum(["low", "medium", "high", "critical"]).default("medium"),
    compliance_status: z.enum(["compliant", "under_review", "non_compliant"]).default("under_review"),
    description: z.string().optional().default(""),
    website: z.string().optional().default(""),
    // Step 3: Data Subjects & Certifications
    data_subjects: z.array(z.string()).default([]),
    security_certifications: z.array(z.string()).default([]),
    processing_locations: z.string().optional().default(""),
    // Step 4: Sub-Processors (stored as JSON in form state, not sent to backend yet)
    sub_processors: z.array(z.object({
        name: z.string(),
        services_provided: z.string(),
        location: z.string(),
    })).default([]),
});

export type WizardFormData = z.infer<typeof wizardFormSchema>;
