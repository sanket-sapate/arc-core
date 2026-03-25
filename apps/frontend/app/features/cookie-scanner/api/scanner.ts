import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { z } from 'zod';
import { api } from '~/lib/api';
import { CookieScanSchema, ScannedCookieSchema } from '../types';

// ── Helpers ──────────────────────────────────────────────────────────────────

const transformCookieScan = (item: any) => ({
    id: item.ID,
    tenant_id: item.TenantID,
    url: item.Url,
    status: item.Status,
    error: item.Error,
    started_at: item.StartedAt,
    completed_at: item.CompletedAt,
    created_at: item.CreatedAt,
    updated_at: item.UpdatedAt,
});

const transformScannedCookie = (item: any) => ({
    id: item.ID,
    scan_id: item.ScanID,
    name: item.Name,
    domain: item.Domain,
    path: item.Path,
    value: item.Value,
    expiration: item.Expiration,
    secure: item.Secure,
    http_only: item.HttpOnly,
    same_site: item.SameSite,
    source: item.Source,
    category: item.Category,
    description: item.Description,
    created_at: item.CreatedAt,
});

// ── Hooks ────────────────────────────────────────────────────────────────────

export const useCookieScans = () =>
    useQuery({
        queryKey: ['cookie-scans'],
        queryFn: async () => {
            const { data } = await api.get('/api/cookie-scanner/scans');
            const transformed = (data ?? []).map(transformCookieScan);
            return z.array(CookieScanSchema).parse(transformed);
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

            const transformed = {
                scan: transformCookieScan(data.scan),
                cookies: (data.cookies ?? []).map(transformScannedCookie),
            };

            return z.object({
                scan: CookieScanSchema,
                cookies: z.array(ScannedCookieSchema),
            }).parse(transformed);
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
            return CookieScanSchema.parse(transformCookieScan(data));
        },
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: ['cookie-scans'] });
        },
    });
};

export const useRescanCookieScan = () => {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: async (scanId: string) => {
            const { data } = await api.post(`/api/cookie-scanner/scans/${scanId}/rescan`);
            return CookieScanSchema.parse(transformCookieScan(data));
        },
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: ['cookie-scans'] });
        },
    });
};

