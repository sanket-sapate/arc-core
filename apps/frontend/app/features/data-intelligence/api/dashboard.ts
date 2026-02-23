import { useQuery } from '@tanstack/react-query';
import { z } from 'zod';
import { api } from '~/lib/api';

// ── Schemas ──────────────────────────────────────────────────────────────────

export const DashboardStatsSchema = z.object({
    total_sources: z.number().optional(),
    total_jobs: z.number().optional(),
    total_findings: z.number().optional(),
    active_agents: z.number().optional(),
    jobs_completed: z.number().optional(),
    jobs_running: z.number().optional(),
    jobs_failed: z.number().optional(),
    findings_by_likelihood: z.record(z.number()).optional(),
    findings_by_type: z.record(z.number()).optional(),
}).passthrough();

export type DashboardStats = z.infer<typeof DashboardStatsSchema>;

// ── Hook ──────────────────────────────────────────────────────────────────────

export const useDashboardStats = () =>
    useQuery({
        queryKey: ['discovery-dashboard'],
        queryFn: async () => {
            const { data } = await api.get('/api/discovery/dashboard');
            return DashboardStatsSchema.parse(data ?? {});
        },
        refetchInterval: 90_000,
        staleTime: 60_000,
        retry: false,
    });
