import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { type ROPA } from "../types/ropa";
import { api } from "~/lib/api";

export function useROPAs() {
    return useQuery({
        queryKey: ["ropas"],
        queryFn: async () => {
            const { data } = await api.get<any>("/api/privacy/v1/ropas");
            return Array.isArray(data) ? data : data?.data || [];
        },
    });
}

export function useROPA(id: string) {
    return useQuery({
        queryKey: ["ropas", id],
        queryFn: async () => {
            if (!id) return null;
            const { data } = await api.get<ROPA>(`/api/privacy/v1/ropas/${id}`);
            return data;
        },
        enabled: !!id,
    });
}

export function useCreateROPA() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (payload: Partial<ROPA>) => {
            const { data } = await api.post("/api/privacy/v1/ropas", payload);
            return data;
        },
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ["ropas"] }),
    });
}

export function useUpdateROPA() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async ({ id, payload }: { id: string; payload: Partial<ROPA> }) => {
            const { data } = await api.put(`/api/privacy/v1/ropas/${id}`, payload);
            return data;
        },
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({ queryKey: ["ropas"] });
            queryClient.invalidateQueries({ queryKey: ["ropas", variables.id] });
        },
    });
}
