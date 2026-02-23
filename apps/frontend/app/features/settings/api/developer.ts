import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "~/lib/api";
import type { ApiKey, NewApiKeyResponse, CreateApiKeyData } from "../types/developer";

export const API_KEY_KEYS = {
    all: ["api-keys"] as const,
};

export function useApiKeys() {
    return useQuery({
        queryKey: API_KEY_KEYS.all,
        queryFn: async () => {
            const { data } = await api.get<ApiKey[]>("/api/iam/api-keys");
            return data;
        },
    });
}

export function useGenerateApiKey() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (payload: CreateApiKeyData) => {
            const { data } = await api.post<NewApiKeyResponse>("/api/iam/api-keys", payload);
            return data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: API_KEY_KEYS.all });
        },
    });
}

export function useRevokeApiKey() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (id: string) => {
            const { data } = await api.delete<any>(`/api/iam/api-keys/${id}`);
            return data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: API_KEY_KEYS.all });
        },
    });
}
