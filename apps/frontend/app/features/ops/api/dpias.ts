import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { type DPIA } from "../types/dpia";
import { api } from "~/lib/api";

export function useDPIAs() {
    return useQuery({
        queryKey: ["dpias"],
        queryFn: async () => {
            const { data } = await api.get<any>("/api/privacy/v1/dpias");
            return Array.isArray(data) ? data : data?.data || [];
        },
    });
}

export function useDPIA(id: string) {
    return useQuery({
        queryKey: ["dpias", id],
        queryFn: async () => {
            if (!id) return null;
            const { data } = await api.get<DPIA>(`/api/privacy/v1/dpias/${id}`);
            return data;
        },
        enabled: !!id,
    });
}

export function useCreateDPIA() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (payload: Partial<DPIA>) => {
            const { data } = await api.post("/api/privacy/v1/dpias", payload);
            return data;
        },
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ["dpias"] }),
    });
}

export function useUpdateDPIA() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async ({ id, payload }: { id: string; payload: Partial<DPIA> }) => {
            const { data } = await api.put(`/api/privacy/v1/dpias/${id}`, payload);
            return data;
        },
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({ queryKey: ["dpias"] });
            queryClient.invalidateQueries({ queryKey: ["dpias", variables.id] });
        },
    });
}
