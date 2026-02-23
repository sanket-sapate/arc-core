import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "~/lib/api";
import type { Grievance, CreateGrievanceData, UpdateGrievanceStatusData } from "../types/grievance";

const GRIEVANCE_KEYS = {
    all: ["grievances"] as const,
    detail: (id: string) => [...GRIEVANCE_KEYS.all, id] as const,
};

export function useGrievances() {
    return useQuery({
        queryKey: GRIEVANCE_KEYS.all,
        queryFn: async () => {
            // Typically, API gateway routes this with a prefix. Using the same pattern as DPIAs.
            const { data } = await api.get<any>("/api/privacy/v1/grievances");
            return Array.isArray(data) ? data : data?.data || [];
        },
    });
}

export function useGrievance(id: string) {
    return useQuery({
        queryKey: GRIEVANCE_KEYS.detail(id),
        queryFn: async () => {
            const { data } = await api.get<Grievance>(`/api/privacy/v1/grievances/${id}`);
            return data;
        },
        enabled: !!id,
    });
}

export function useCreateGrievance() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (payload: CreateGrievanceData) => {
            const { data } = await api.post<Grievance>("/api/privacy/v1/grievances", payload);
            return data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: GRIEVANCE_KEYS.all });
        },
    });
}

export function useUpdateGrievanceStatus() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({ id, payload }: { id: string; payload: UpdateGrievanceStatusData }) => {
            const { data } = await api.patch<Grievance>(`/api/privacy/v1/grievances/${id}/status`, payload);
            return data;
        },
        onSuccess: (_, { id }) => {
            queryClient.invalidateQueries({ queryKey: GRIEVANCE_KEYS.all });
            queryClient.invalidateQueries({ queryKey: GRIEVANCE_KEYS.detail(id) });
        },
    });
}
