import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { z } from 'zod';
import { api } from '~/lib/api';

// ── Schemas ──────────────────────────────────────────────────────────────────

export const JobSchema = z.object({
    id: z.string(),
    source_id: z.string().optional(),
    source_name: z.string().optional(),
    profile_id: z.string().optional(),
    status: z.string(),
    type: z.string().optional(),
    created_at: z.string().optional(),
    completed_at: z.string().optional(),
    findings_count: z.number().optional(),
});
export type Job = z.infer<typeof JobSchema>;

export const FindingSchema = z.object({
    id: z.string().optional(),
    info_type: z.string(),
    likelihood: z.string().optional(),
    location: z.string(),
    confidence: z.number().optional(),
    sample_value: z.string().optional(),
    table: z.string().optional(),
    column: z.string().optional(),
    path: z.string().optional(),
});
export type Finding = z.infer<typeof FindingSchema>;

export const FindingsResponseSchema = z.object({
    count: z.number().default(0),
    page: z.number().default(1),
    page_size: z.number().default(100),
    total_pages: z.number().default(0),
    findings: z.array(FindingSchema).default([]),
});
export type FindingsResponse = z.infer<typeof FindingsResponseSchema>;

export const StructureNodeSchema = z.object({
    level1: z.string(),
    level2: z.string(),
    count: z.number(),
});
export const JobStructureSchema = z.object({
    job_id: z.string(),
    category: z.string(),
    nodes: z.array(StructureNodeSchema),
});
export type JobStructure = z.infer<typeof JobStructureSchema>;

export interface FindingsFilters {
    table?: string;
    column?: string;
    path?: string;
    type?: 'raw' | 'refined';
}

// ── API functions ─────────────────────────────────────────────────────────────

const listJobs = async (page = 1, pageSize = 50): Promise<Job[]> => {
    const { data } = await api.get('/api/discovery/jobs', { params: { page, page_size: pageSize } });
    return z.array(JobSchema).parse(data ?? []);
};

const getJobFindings = async (
    jobId: string,
    page = 1,
    pageSize = 100,
    filters?: FindingsFilters
): Promise<FindingsResponse> => {
    const { data } = await api.get(`/api/discovery/jobs/${jobId}/findings`, {
        params: { page, page_size: pageSize, ...filters },
    });
    // Handle both { findings: [...] } envelope and flat array
    if (Array.isArray(data)) {
        return { count: data.length, page: 1, page_size: pageSize, total_pages: 1, findings: z.array(FindingSchema).parse(data) };
    }
    return FindingsResponseSchema.parse(data ?? {});
};

const getJobStructure = async (jobId: string): Promise<JobStructure> => {
    const { data } = await api.get(`/api/discovery/jobs/${jobId}/structure`);
    return JobStructureSchema.parse(data);
};

const triggerScan = async (payload: { source_id: string; profile_id?: string }): Promise<unknown> => {
    const { data } = await api.post('/api/discovery/scans/trigger', payload);
    return data;
};

const deleteJob = async (id: string): Promise<void> => {
    await api.delete(`/api/discovery/jobs/${id}`);
};

const refineJob = async (id: string): Promise<unknown> => {
    const { data } = await api.post(`/api/discovery/jobs/${id}/refine`, {});
    return data;
};

// ── Hooks ─────────────────────────────────────────────────────────────────────

export const useJobs = (page = 1, pageSize = 50) =>
    useQuery({
        queryKey: ['discovery-jobs', page, pageSize],
        queryFn: () => listJobs(page, pageSize),
        refetchInterval: 90_000,
        staleTime: 30_000,
        retry: false,
    });

export const useJobFindings = (jobId: string | null, page = 1, pageSize = 100, filters?: FindingsFilters) =>
    useQuery({
        queryKey: ['discovery-job-findings', jobId, page, pageSize, filters],
        queryFn: () => getJobFindings(jobId!, page, pageSize, filters),
        enabled: !!jobId,
        staleTime: 60_000,
        retry: false,
    });

export const useJobStructure = (jobId: string | null) =>
    useQuery({
        queryKey: ['discovery-job-structure', jobId],
        queryFn: () => getJobStructure(jobId!),
        enabled: !!jobId,
        staleTime: 120_000,
        retry: false,
    });

export const useTriggerScan = () => {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: triggerScan,
        onSuccess: () => qc.invalidateQueries({ queryKey: ['discovery-jobs'] }),
    });
};

export const useDeleteJob = () => {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: deleteJob,
        onSuccess: () => qc.invalidateQueries({ queryKey: ['discovery-jobs'] }),
    });
};

export const useRefineJob = () => {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: refineJob,
        onSuccess: () => qc.invalidateQueries({ queryKey: ['discovery-jobs'] }),
    });
};
