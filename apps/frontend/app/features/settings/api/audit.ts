import { useQuery } from "@tanstack/react-query";
import { api } from "~/lib/api";

export interface AuditLog {
    id: string;
    action: string;
    entity_type: string;
    entity_id: string;
    actor_id: string;
    actor_email: string;
    metadata: Record<string, any>;
    created_at: string;
}

export function useAuditLogs() {
    return useQuery({
        queryKey: ["admin_audit_logs"],
        queryFn: async () => {
            const { data } = await api.get<AuditLog[]>("/api/iam/admin/audit-logs");
            return data;
        },
    });
}
