import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "~/lib/api";
import { z } from "zod";

export const PORTAL_KEYS = {
    all: ["portal"] as const,
    consents: () => [...PORTAL_KEYS.all, "consents"] as const,
    grievances: () => [...PORTAL_KEYS.all, "grievances"] as const,
    requests: () => [...PORTAL_KEYS.all, "requests"] as const,
    nominees: () => [...PORTAL_KEYS.all, "nominees"] as const,
    summary: () => [...PORTAL_KEYS.all, "summary"] as const,
};

export const PrivacyRequestSchema = z.object({
    id: z.string(),
    type: z.string(),
    status: z.string(),
    description: z.string().optional(),
    resolution: z.string().optional(),
    created_at: z.string(),
});

export const GrievanceSchema = z.object({
    id: z.string(),
    issue_type: z.string(),
    status: z.string(),
    priority: z.string().optional(),
    description: z.string().optional(),
    resolution: z.string().optional(),
    created_at: z.string(),
});

export const NomineeSchema = z.object({
    id: z.string(),
    nominee_name: z.string(),
    nominee_email: z.string(),
    nominee_relation: z.string(),
    status: z.string(),
    created_at: z.string(),
});

export function useUserConsents() {
    return useQuery({
        queryKey: PORTAL_KEYS.consents(),
        queryFn: async () => {
            const { data } = await api.get("/api/portal/data/consents", { withCredentials: true });
            return Array.isArray(data) ? data : data?.data || [];
        },
        retry: 1,
    });
}

export function useUserGrievances() {
    return useQuery({
        queryKey: PORTAL_KEYS.grievances(),
        queryFn: async () => {
            const { data } = await api.get("/api/portal/data/grievances", { withCredentials: true });
            return z.array(GrievanceSchema).parse(Array.isArray(data) ? data : data?.data || []);
        },
        retry: 1,
    });
}

export function useUserRequests() {
    return useQuery({
        queryKey: PORTAL_KEYS.requests(),
        queryFn: async () => {
            const { data } = await api.get("/api/portal/data/requests", { withCredentials: true });
            return z.array(PrivacyRequestSchema).parse(Array.isArray(data) ? data : data?.data || []);
        },
        retry: 1,
    });
}

export function usePortalSummary() {
    return useQuery({
        queryKey: PORTAL_KEYS.summary(),
        queryFn: async () => {
            const { data } = await api.get("/api/portal/data/dashboard/summary", { withCredentials: true });
            return data as { total_consents: number, active_requests: number, open_grievances: number };
        },
        retry: 1,
    });
}

export function useUserNominees() {
    return useQuery({
        queryKey: PORTAL_KEYS.nominees(),
        queryFn: async () => {
            const { data } = await api.get("/api/portal/data/nominees", { withCredentials: true });
            return z.array(NomineeSchema).parse(Array.isArray(data) ? data : data?.data || []);
        },
        retry: 1,
    });
}

export function useSubmitPrivacyRequest() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (input: { type: string, description: string }) => {
            const { data } = await api.post("/api/portal/data/requests", input, { withCredentials: true });
            return data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: PORTAL_KEYS.all });
        },
    });
}

export function useSubmitGrievance() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (input: { issue_type: string, description: string, priority?: string }) => {
            const { data } = await api.post("/api/portal/data/grievances", input, { withCredentials: true });
            return data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: PORTAL_KEYS.all });
        },
    });
}

export function useRegisterNominee() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (input: { nominee_name: string, nominee_email: string, nominee_relation: string }) => {
            const { data } = await api.post("/api/portal/data/nominees", input, { withCredentials: true });
            return data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: PORTAL_KEYS.all });
        },
    });
}
