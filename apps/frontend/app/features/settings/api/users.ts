import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "~/lib/api";
import type { User, InviteUserData } from "../types/iam";

export const USER_KEYS = {
    all: ["users"] as const,
};

export function useUsers() {
    return useQuery({
        queryKey: USER_KEYS.all,
        queryFn: async () => {
            const { data } = await api.get<User[]>("/api/iam/users");
            return data;
        },
    });
}

export function useInviteUser() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (payload: InviteUserData) => {
            const { data } = await api.post<any>("/api/iam/users/invite", payload);
            return data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: USER_KEYS.all });
        },
    });
}

export function useUpdateUserRole() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({ id, roleId }: { id: string; roleId: string }) => {
            const { data } = await api.patch<any>(`/api/iam/users/${id}/role`, { role_id: roleId });
            return data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: USER_KEYS.all });
        },
    });
}

export function useRemoveUser() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (id: string) => {
            const { data } = await api.delete<any>(`/api/iam/users/${id}`);
            return data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: USER_KEYS.all });
        },
    });
}
