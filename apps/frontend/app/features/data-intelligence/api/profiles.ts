import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { z } from 'zod';
import { api } from '~/lib/api';

// ── Schemas ──────────────────────────────────────────────────────────────────

export const ScanProfileSchema = z.object({
    id: z.string(),
    name: z.string(),
    description: z.string().optional(),
    rule_count: z.number().optional(),
    created_at: z.string().optional(),
    rules: z.array(z.object({ id: z.string(), name: z.string() })).optional(),
});
export type ScanProfile = z.infer<typeof ScanProfileSchema>;

// ── Hooks ─────────────────────────────────────────────────────────────────────

export const useProfiles = () =>
    useQuery({
        queryKey: ['discovery-profiles'],
        queryFn: async () => {
            const { data } = await api.get('/api/discovery/profiles');
            return z.array(ScanProfileSchema).parse(data ?? []);
        },
        staleTime: 60_000,
        retry: false,
    });

export const useProfileDetails = (profileId: string | null) =>
    useQuery({
        queryKey: ['discovery-profile', profileId],
        queryFn: async () => {
            const { data } = await api.get(`/api/discovery/profiles/${profileId}`);
            return data;
        },
        enabled: !!profileId,
        staleTime: 30_000,
    });

export const useCreateProfile = () => {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: async (payload: { name: string; description?: string }) => {
            const { data } = await api.post('/api/discovery/profiles', payload);
            return data;
        },
        onSuccess: () => qc.invalidateQueries({ queryKey: ['discovery-profiles'] }),
    });
};

export const useUpdateProfile = () => {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: async ({ id, data: payload }: { id: string; data: { name: string; description?: string } }) => {
            const { data } = await api.put(`/api/discovery/profiles/${id}`, payload);
            return data;
        },
        onSuccess: () => qc.invalidateQueries({ queryKey: ['discovery-profiles'] }),
    });
};

export const useDeleteProfile = () => {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: async (id: string) => {
            await api.delete(`/api/discovery/profiles/${id}`);
        },
        onSuccess: () => qc.invalidateQueries({ queryKey: ['discovery-profiles'] }),
    });
};

export const useAssignRuleToProfile = () => {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: async ({ profileId, ruleId }: { profileId: string; ruleId: string }) => {
            const { data } = await api.post(`/api/discovery/profiles/${profileId}/rules`, { rule_id: ruleId });
            return data;
        },
        onSuccess: (_, v) => qc.invalidateQueries({ queryKey: ['discovery-profile', v.profileId] }),
    });
};

export const useRemoveRuleFromProfile = () => {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: async ({ profileId, ruleId }: { profileId: string; ruleId: string }) => {
            await api.delete(`/api/discovery/profiles/${profileId}/rules/${ruleId}`);
        },
        onSuccess: (_, v) => qc.invalidateQueries({ queryKey: ['discovery-profile', v.profileId] }),
    });
};
