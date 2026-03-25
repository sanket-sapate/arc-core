import { z } from 'zod';

// ── Models ───────────────────────────────────────────────────────────────────

export const ScannedCookieSchema = z.object({
    id: z.string().uuid(),
    scan_id: z.string().uuid(),
    name: z.string(),
    domain: z.string().nullable(),
    path: z.string().nullable(),
    value: z.string().nullable(),
    expiration: z.string().nullable(),
    secure: z.boolean(),
    http_only: z.boolean(),
    same_site: z.string().nullable(),
    source: z.string(),
    category: z.string(),
    description: z.string().nullable(),
    created_at: z.string(),
});

export const CookieScanSchema = z.object({
    id: z.string().uuid(),
    tenant_id: z.string().uuid(),
    url: z.string(),
    status: z.enum(['pending', 'running', 'completed', 'failed']),
    error: z.string().nullable(),
    started_at: z.string().nullable(),
    completed_at: z.string().nullable(),
    created_at: z.string(),
    updated_at: z.string(),
});

export type ScannedCookie = z.infer<typeof ScannedCookieSchema>;
export type CookieScan = z.infer<typeof CookieScanSchema>;

// ── UI Helpers ───────────────────────────────────────────────────────────────

export const CAT_COLORS: Record<string, string> = {
    Analytics: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300",
    Marketing: "bg-rose-100 text-rose-800 dark:bg-rose-900/30 dark:text-rose-300",
    Functional: "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300",
    Necessary: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300",
};
