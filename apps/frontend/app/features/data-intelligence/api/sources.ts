import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { z } from 'zod';
import { api } from '~/lib/api';

// ── Schemas ──────────────────────────────────────────────────────────────────

export const SourceSchema = z.object({
    id: z.string(),
    name: z.string(),
    type: z.string(),
    status: z.string().optional(),
    worker_group: z.string().optional(),
    created_at: z.string().optional(),
    configuration: z.record(z.unknown()).optional(),
});
export type Source = z.infer<typeof SourceSchema>;

export type SourceType = 'postgres' | 'mysql' | 'mssql' | 's3' | 'agent_linux' | 'agent_windows';

// ── Payload builder ───────────────────────────────────────────────────────────
// The scanner expects: { name, type, configuration: { host, port, ... }, worker_group? }
export interface RegisterSourceInput {
    name: string;
    type: SourceType;
    configuration: Record<string, unknown>;
    worker_group?: string;
}

// ── API functions ─────────────────────────────────────────────────────────────

const listSources = async (): Promise<Source[]> => {
    const { data } = await api.get('/api/discovery/sources');
    return z.array(SourceSchema).parse(data ?? []);
};

const registerSource = async (payload: RegisterSourceInput): Promise<Source> => {
    const { data } = await api.post('/api/discovery/sources', payload);
    return SourceSchema.parse(data);
};

const updateSource = async (id: string, payload: Partial<RegisterSourceInput>): Promise<Source> => {
    const { data } = await api.patch(`/api/discovery/sources/${id}`, payload);
    return SourceSchema.parse(data);
};

const deleteSource = async (id: string): Promise<void> => {
    await api.delete(`/api/discovery/sources/${id}`);
};

// ── Hooks ─────────────────────────────────────────────────────────────────────

export const useSources = () =>
    useQuery({
        queryKey: ['discovery-sources'],
        queryFn: listSources,
        staleTime: 30_000,
        retry: false,
    });

export const useRegisterSource = () => {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: registerSource,
        onSuccess: () => qc.invalidateQueries({ queryKey: ['discovery-sources'] }),
    });
};

export const useUpdateSource = () => {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: ({ id, data }: { id: string; data: Partial<RegisterSourceInput> }) => updateSource(id, data),
        onSuccess: () => qc.invalidateQueries({ queryKey: ['discovery-sources'] }),
    });
};

export const useDeleteSource = () => {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: deleteSource,
        onSuccess: () => qc.invalidateQueries({ queryKey: ['discovery-sources'] }),
    });
};
