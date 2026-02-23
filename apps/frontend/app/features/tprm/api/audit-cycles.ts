import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { type AuditCycle } from "../types/audit-cycle";
import { api } from "~/lib/api";

export function useAuditCycles() {
    return useQuery({
        queryKey: ["audit-cycles"],
        queryFn: async () => {
            const { data } = await api.get<AuditCycle[]>("/api/trm/audit-cycles");
            return data;
        },
    });
}

export function useAuditCycle(id: string) {
    return useQuery({
        queryKey: ["audit-cycles", id],
        queryFn: async () => {
            if (!id) return null;
            const { data } = await api.get<AuditCycle>(`/api/trm/audit-cycles/${id}`);
            return data;
        },
        enabled: !!id,
    });
}

export function useCreateAuditCycle() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (payload: Partial<AuditCycle>) => {
            const { data } = await api.post("/api/trm/audit-cycles", payload);
            return data;
        },
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ["audit-cycles"] }),
    });
}
