import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { portalApi } from "~/lib/api";
import { z } from "zod";

export const PORTAL_KEYS = {
    all: ["portal"] as const,
    consents: () => [...PORTAL_KEYS.all, "consents"] as const,
    grievances: () => [...PORTAL_KEYS.all, "grievances"] as const,
    requests: () => [...PORTAL_KEYS.all, "requests"] as const,
    nominees: () => [...PORTAL_KEYS.all, "nominees"] as const,
    summary: () => [...PORTAL_KEYS.all, "summary"] as const,
};

export const ConsentSchema = z.object({
    id: z.string(),
    domain: z.string(),
    created_at: z.string(),
    status: z.string().optional(),
});

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
            try {
                const { data } = await portalApi.get("/api/portal/data/consents");
                console.log('Consents API response:', data);
                const consents = Array.isArray(data) ? data : data?.data || [];
                console.log('Parsed consents:', consents);
                return z.array(ConsentSchema).parse(consents);
            } catch (error) {
                console.error('Error fetching consents:', error);
                throw error;
            }
        },
        retry: 1,
    });
}

export function useUserGrievances() {
    return useQuery({
        queryKey: PORTAL_KEYS.grievances(),
        queryFn: async () => {
            try {
                const { data } = await portalApi.get("/api/portal/data/grievances");
                console.log('Grievances API response:', data);
                const grievances = Array.isArray(data) ? data : data?.data || [];
                return z.array(GrievanceSchema).parse(grievances);
            } catch (error) {
                console.error('Error fetching grievances:', error);
                throw error;
            }
        },
        retry: 1,
    });
}

export function useUserRequests() {
    return useQuery({
        queryKey: PORTAL_KEYS.requests(),
        queryFn: async () => {
            try {
                const { data } = await portalApi.get("/api/portal/data/requests");
                console.log('Requests API response:', data);
                const requests = Array.isArray(data) ? data : data?.data || [];
                return z.array(PrivacyRequestSchema).parse(requests);
            } catch (error) {
                console.error('Error fetching requests:', error);
                throw error;
            }
        },
        retry: 1,
    });
}

export function usePortalSummary() {
    return useQuery({
        queryKey: PORTAL_KEYS.summary(),
        queryFn: async () => {
            const { data } = await portalApi.get("/api/portal/data/dashboard/summary");
            return data as { total_consents: number, active_requests: number, open_grievances: number };
        },
        retry: 1,
    });
}

export function useUserNominees() {
    return useQuery({
        queryKey: PORTAL_KEYS.nominees(),
        queryFn: async () => {
            const { data } = await portalApi.get("/api/portal/data/nominees");
            return z.array(NomineeSchema).parse(Array.isArray(data) ? data : data?.data || []);
        },
        retry: 1,
    });
}

export function useSubmitPrivacyRequest() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (input: { type: string, description: string }) => {
            const { data } = await portalApi.post("/api/portal/data/requests", input);
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
            const { data } = await portalApi.post("/api/portal/data/grievances", input);
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
            const { data } = await portalApi.post("/api/portal/data/nominees", input);
            return data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: PORTAL_KEYS.all });
        },
    });
}
