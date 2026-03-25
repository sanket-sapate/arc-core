import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { type Framework, type FrameworkQuestion } from "../types/framework";
import { api } from "~/lib/api";

const mapFramework = (f: any): Framework => ({
    id: f.ID || f.id,
    name: f.Name || f.name,
    version: f.Version || f.version,
    description: f.Description || f.description || "",
    created_at: f.CreatedAt || f.created_at,
    updated_at: f.UpdatedAt || f.updated_at,
});

export function useFrameworks() {
    return useQuery({
        queryKey: ["frameworks"],
        queryFn: async () => {
            const { data } = await api.get<any[]>("/api/trm/frameworks");
            return (data || []).map(mapFramework);
        },
    });
}

export function useFramework(id: string) {
    return useQuery({
        queryKey: ["frameworks", id],
        queryFn: async () => {
            if (!id) return null;
            const { data } = await api.get<any>(`/api/trm/frameworks/${id}`);
            return data ? mapFramework(data) : null;
        },
        enabled: !!id,
    });
}

export function useCreateFramework() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (payload: Partial<Framework>) => {
            const { data } = await api.post("/api/trm/frameworks", payload);
            return mapFramework(data);
        },
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ["frameworks"] }),
    });
}

export function useUpdateFramework() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async ({ id, payload }: { id: string; payload: Partial<Framework> }) => {
            const { data } = await api.put(`/api/trm/frameworks/${id}`, payload);
            return mapFramework(data);
        },
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ["frameworks"] }),
    });
}

export function useDeleteFramework() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (id: string) => {
            await api.delete(`/api/trm/frameworks/${id}`);
        },
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ["frameworks"] }),
    });
}

const mapFrameworkQuestion = (q: any): FrameworkQuestion => ({
    id: q.ID || q.id,
    framework_id: q.FrameworkID || q.framework_id,
    question_text: q.QuestionText || q.question_text,
    question_type: q.QuestionType || q.question_type,
    options: q.Options ? (typeof q.Options === 'string' ? JSON.parse(atob(q.Options)) : q.Options) : null,
    created_at: q.CreatedAt || q.created_at,
});

export function useFrameworkQuestions(frameworkId: string) {
    return useQuery({
        queryKey: ["frameworks", frameworkId, "questions"],
        queryFn: async () => {
            if (!frameworkId) return [];
            const { data } = await api.get<any[]>(`/api/trm/frameworks/${frameworkId}/questions`);
            return (data || []).map(mapFrameworkQuestion);
        },
        enabled: !!frameworkId,
    });
}

export function useCreateFrameworkQuestion() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async ({ frameworkId, payload }: { frameworkId: string; payload: Partial<FrameworkQuestion> }) => {
            const { data } = await api.post(`/api/trm/frameworks/${frameworkId}/questions`, payload);
            return mapFrameworkQuestion(data);
        },
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({ queryKey: ["frameworks", variables.frameworkId, "questions"] });
        },
    });
}
