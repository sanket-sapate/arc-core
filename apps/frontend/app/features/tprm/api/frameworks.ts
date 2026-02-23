import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { type Framework, type FrameworkQuestion } from "../types/framework";
import { api } from "~/lib/api";

export function useFrameworks() {
    return useQuery({
        queryKey: ["frameworks"],
        queryFn: async () => {
            const { data } = await api.get<Framework[]>("/api/trm/frameworks");
            return data;
        },
    });
}

export function useFramework(id: string) {
    return useQuery({
        queryKey: ["frameworks", id],
        queryFn: async () => {
            if (!id) return null;
            const { data } = await api.get<Framework>(`/api/trm/frameworks/${id}`);
            return data;
        },
        enabled: !!id,
    });
}

export function useCreateFramework() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (payload: Partial<Framework>) => {
            const { data } = await api.post("/api/trm/frameworks", payload);
            return data;
        },
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ["frameworks"] }),
    });
}

export function useFrameworkQuestions(frameworkId: string) {
    return useQuery({
        queryKey: ["frameworks", frameworkId, "questions"],
        queryFn: async () => {
            if (!frameworkId) return [];
            const { data } = await api.get<FrameworkQuestion[]>(`/api/trm/frameworks/${frameworkId}/questions`);
            return data;
        },
        enabled: !!frameworkId,
    });
}
