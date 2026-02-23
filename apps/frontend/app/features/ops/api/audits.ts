import { useQuery } from "@tanstack/react-query";
import { api } from "~/lib/api";
import type { PrivacyAuditLog } from "../types/audit";

export const PRIVACY_AUDIT_KEYS = {
    all: ["privacy_audit_logs"] as const,
};

export function usePrivacyAuditLogs() {
    return useQuery({
        queryKey: PRIVACY_AUDIT_KEYS.all,
        queryFn: async () => {
            const { data } = await api.get<PrivacyAuditLog[]>("/api/privacy/v1/audit-logs");
            return data;
        },
    });
}
