import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { z } from 'zod';
import { api } from '~/lib/api';

// ── Schemas ──────────────────────────────────────────────────────────────────

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

// ── Hooks ────────────────────────────────────────────────────────────────────

export const useCookieScans = () =>
    useQuery({
        queryKey: ['cookie-scans'],
        queryFn: async () => {
            const { data } = await api.get('/api/cookie-scanner/scans');
            return z.array(CookieScanSchema).parse(data ?? []);
        },
        refetchInterval: (q) => {
            // Refetch every 3s if any scan is pending or running
            const hasRunning = q.state.data?.some(s => s.status === 'pending' || s.status === 'running');
            return hasRunning ? 3000 : false;
        }
    });

export const useCookieScanDetails = (scanId: string | null) =>
    useQuery({
        queryKey: ['cookie-scans', scanId],
        queryFn: async () => {
            const { data } = await api.get(`/api/cookie-scanner/scans/${scanId}`);
            return z.object({
                scan: CookieScanSchema,
                cookies: z.array(ScannedCookieSchema),
            }).parse(data);
        },
        enabled: !!scanId,
        refetchInterval: (q) => {
            return (q.state.data?.scan.status === 'pending' || q.state.data?.scan.status === 'running') ? 2000 : false;
        }
    });

export const useStartCookieScan = () => {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: async (url: string) => {
            const { data } = await api.post('/api/cookie-scanner/scans', { url });
            return CookieScanSchema.parse(data);
        },
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: ['cookie-scans'] });
        },
    });
};
