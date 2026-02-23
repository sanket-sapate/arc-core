import { useMutation, useQuery } from "@tanstack/react-query";
import type { CreateScriptRuleInput, ScriptRule, UpdateScriptRuleInput } from "../types/script-rule";
import { api, queryClient } from "~/lib/api";

const SCRIPT_RULES_KEY = ['script-rules'];

export const useScriptRules = () => {
    return useQuery<ScriptRule[]>({
        queryKey: SCRIPT_RULES_KEY,
        queryFn: async () => {
            const { data } = await api.get('/api/privacy/api/v1/script-rules');
            return data || [];
        },
    });
};

export const useCreateScriptRule = () => {
    return useMutation({
        mutationFn: async (input: CreateScriptRuleInput) => {
            const { data } = await api.post('/api/privacy/api/v1/script-rules', input);
            return data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: SCRIPT_RULES_KEY });
        },
    });
};

export const useUpdateScriptRule = () => {
    return useMutation({
        mutationFn: async ({ id, data: input }: { id: string, data: UpdateScriptRuleInput }) => {
            const { data } = await api.put(`/api/privacy/api/v1/script-rules/${id}`, input);
            return data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: SCRIPT_RULES_KEY });
        },
    });
};

export const useDeleteScriptRule = () => {
    return useMutation({
        mutationFn: async (id: string) => {
            await api.delete(`/api/privacy/api/v1/script-rules/${id}`);
            return true;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: SCRIPT_RULES_KEY });
        },
    });
};
