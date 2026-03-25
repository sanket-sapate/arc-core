import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { z } from 'zod';
import { api } from '~/lib/api';

// ── Schemas ──────────────────────────────────────────────────────────────────

export const ScheduleSchema = z.object({
    id: z.string(),
    source_id: z.string(),
    frequency: z.string(),
    profile_id: z.string().optional(),
    enabled: z.boolean().optional(),
    next_run_at: z.string().optional(),
    last_run_at: z.string().optional(),
    created_at: z.string().optional(),
});
export type Schedule = z.infer<typeof ScheduleSchema>;

export interface CreateScheduleInput {
    source_id: string;
    frequency: string;
    profile_id?: string;
}

// ── API Functions ────────────────────────────────────────────────────────────

const listSchedules = async (): Promise<Schedule[]> => {
    const { data } = await api.get('/api/discovery/schedules');
    // Handle both array and envelope
    if (Array.isArray(data)) return z.array(ScheduleSchema).parse(data);
    if (data?.data && Array.isArray(data.data)) return z.array(ScheduleSchema).parse(data.data);
    if (data?.schedules && Array.isArray(data.schedules)) return z.array(ScheduleSchema).parse(data.schedules);
    return [];
};

const createSchedule = async (payload: CreateScheduleInput): Promise<unknown> => {
    const { data } = await api.post('/api/discovery/schedules', payload);
    return data;
};

const deleteSchedule = async (id: string): Promise<void> => {
    await api.delete(`/api/discovery/schedules/${id}`);
};

// ── Hooks ────────────────────────────────────────────────────────────────────

export const useSchedules = () =>
    useQuery({
        queryKey: ['discovery-schedules'],
        queryFn: listSchedules,
        staleTime: 30_000,
        retry: false,
    });

export const useCreateSchedule = () => {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: createSchedule,
        onSuccess: () => qc.invalidateQueries({ queryKey: ['discovery-schedules'] }),
    });
};

export const useDeleteSchedule = () => {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: deleteSchedule,
        onSuccess: () => qc.invalidateQueries({ queryKey: ['discovery-schedules'] }),
    });
};
