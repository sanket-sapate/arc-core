import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { z } from 'zod';
import { api } from '~/lib/api';

// ── Schemas ──────────────────────────────────────────────────────────────────

export const DLPRuleSchema = z.object({
    id: z.string(),
    name: z.string(),
    description: z.string().optional(),
    pattern: z.string().optional(),
    info_type: z.string().optional(),
    enabled: z.boolean().optional(),
    created_at: z.string().optional(),
});
export type DLPRule = z.infer<typeof DLPRuleSchema>;

// ── Hooks ─────────────────────────────────────────────────────────────────────

export const useRules = () =>
    useQuery({
        queryKey: ['discovery-rules'],
        queryFn: async () => {
            const { data } = await api.get('/api/discovery/rules');
            return z.array(DLPRuleSchema).parse(data ?? []);
        },
        staleTime: 60_000,
        retry: false,
    });

export const useCreateRule = () => {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: async (payload: Record<string, unknown>) => {
            const { data } = await api.post('/api/discovery/rules', payload);
            return data;
        },
        onSuccess: () => qc.invalidateQueries({ queryKey: ['discovery-rules'] }),
    });
};

export const useUpdateRule = () => {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: async ({ id, data: payload }: { id: string; data: Record<string, unknown> }) => {
            const { data } = await api.put(`/api/discovery/rules/${id}`, payload);
            return data;
        },
        onSuccess: () => qc.invalidateQueries({ queryKey: ['discovery-rules'] }),
    });
};

export const useDeleteRule = () => {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: async (id: string) => {
            await api.delete(`/api/discovery/rules/${id}`);
        },
        onSuccess: () => qc.invalidateQueries({ queryKey: ['discovery-rules'] }),
    });
};
