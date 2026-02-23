import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "~/lib/api";
import type { Breach, CreateBreachData, UpdateBreachData } from "../types/breach";

export const BREACH_KEYS = {
    all: ["breaches"] as const,
    detail: (id: string) => [...BREACH_KEYS.all, id] as const,
};

export function useBreaches() {
    return useQuery({
        queryKey: BREACH_KEYS.all,
        queryFn: async () => {
            const { data } = await api.get<Breach[]>("/api/privacy/v1/breaches");
            return data;
        },
    });
}

export function useCreateBreach() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (payload: CreateBreachData) => {
            const { data } = await api.post<Breach>("/api/privacy/v1/breaches", payload);
            return data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: BREACH_KEYS.all });
        },
    });
}

export function useUpdateBreach() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({ id, payload }: { id: string; payload: UpdateBreachData }) => {
            const { data } = await api.put<Breach>(`/api/privacy/v1/breaches/${id}`, payload);
            return data;
        },
        onSuccess: (_, { id }) => {
            queryClient.invalidateQueries({ queryKey: BREACH_KEYS.all });
            queryClient.invalidateQueries({ queryKey: BREACH_KEYS.detail(id) });
        },
    });
}

export function useDeleteBreach() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (id: string) => {
            await api.delete(`/api/privacy/v1/breaches/${id}`);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: BREACH_KEYS.all });
        },
    });
}
