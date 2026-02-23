import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "~/lib/api";
import type { PrivacyRequest, CreatePrivacyRequestData, UpdatePrivacyRequestStatusData } from "../types/dsr";

const DSR_KEYS = {
    all: ["dsrs"] as const,
    detail: (id: string) => [...DSR_KEYS.all, id] as const,
};

export function usePrivacyRequests() {
    return useQuery({
        queryKey: DSR_KEYS.all,
        queryFn: async () => {
            const { data } = await api.get<any>("/api/privacy/v1/privacy-requests");
            return Array.isArray(data) ? data : data?.data || [];
        },
    });
}

export function usePrivacyRequest(id: string) {
    return useQuery({
        queryKey: DSR_KEYS.detail(id),
        queryFn: async () => {
            const { data } = await api.get<PrivacyRequest>(`/api/privacy/v1/privacy-requests/${id}`);
            return data;
        },
        enabled: !!id,
    });
}

export function useCreatePrivacyRequest() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (payload: CreatePrivacyRequestData) => {
            const { data } = await api.post<PrivacyRequest>("/api/privacy/v1/privacy-requests", payload);
            return data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: DSR_KEYS.all });
        },
    });
}

export function useUpdatePrivacyRequestStatus() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({ id, payload }: { id: string; payload: UpdatePrivacyRequestStatusData }) => {
            const { data } = await api.patch<PrivacyRequest>(`/api/privacy/v1/privacy-requests/${id}/status`, payload);
            return data;
        },
        onSuccess: (_, { id }) => {
            queryClient.invalidateQueries({ queryKey: DSR_KEYS.all });
            queryClient.invalidateQueries({ queryKey: DSR_KEYS.detail(id) });
        },
    });
}
