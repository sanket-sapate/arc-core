import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "~/lib/api";
import type { Role, Permission, CreateRoleData, UpdateRoleData } from "../types/iam";

export const ROLE_KEYS = {
    all: ["roles"] as const,
    permissions: ["permissions"] as const,
};

export function useRoles() {
    return useQuery({
        queryKey: ROLE_KEYS.all,
        queryFn: async () => {
            const { data } = await api.get<Role[]>("/api/iam/roles");
            return data;
        },
    });
}

export function usePermissions() {
    return useQuery({
        queryKey: ROLE_KEYS.permissions,
        queryFn: async () => {
            const { data } = await api.get<Permission[]>("/api/iam/permissions");
            return data;
        },
    });
}

export function useCreateRole() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (payload: CreateRoleData) => {
            const { data } = await api.post<Role>("/api/iam/roles", payload);
            return data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ROLE_KEYS.all });
        },
    });
}

export function useUpdateRole() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({ id, payload }: { id: string; payload: UpdateRoleData }) => {
            const { data } = await api.put<Role>(`/api/iam/roles/${id}`, payload);
            return data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ROLE_KEYS.all });
        },
    });
}

