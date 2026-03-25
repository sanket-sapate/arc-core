import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { type Assessment, type AssessmentAnswer } from "../types/assessment";
import { api } from "~/lib/api";

const mapAssessment = (a: any): Assessment => ({
    id: a.ID || a.id,
    vendor_id: a.VendorID || a.vendor_id,
    framework_id: a.FrameworkID || a.framework_id,
    audit_cycle_id: a.AuditCycleID ?? a.audit_cycle_id ?? null,
    status: a.Status || a.status || "draft",
    score: a.Score ?? a.score ?? null,
    created_at: a.CreatedAt || a.created_at,
    updated_at: a.UpdatedAt || a.updated_at,
});

export function useAssessments(vendorId?: string) {
    return useQuery({
        queryKey: ["assessments", vendorId],
        queryFn: async () => {
            const endpoint = vendorId
                ? `/api/trm/vendors/${vendorId}/assessments`
                : `/api/trm/assessments`; // Typically, we need an endpoint to list all across vendors, if not it might 404. Assuming we have one or might need one.
            const { data } = await api.get<any[]>(endpoint);
            return (data || []).map(mapAssessment);
        },
    });
}

export function useAssessment(id: string) {
    return useQuery({
        queryKey: ["assessments", id],
        queryFn: async () => {
            if (!id) return null;
            const { data } = await api.get<any>(`/api/trm/assessments/${id}`);
            return data ? mapAssessment(data) : null;
        },
        enabled: !!id,
    });
}

export function useCreateAssessment() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (payload: Partial<Assessment>) => {
            const { data } = await api.post(`/api/trm/vendors/${payload.vendor_id}/assessments`, payload);
            return mapAssessment(data);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["assessments"] });
        },
    });
}

export function useUpdateAssessmentStatus() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async ({ id, status, score }: { id: string; status: string; score?: number }) => {
            const { data } = await api.patch(`/api/trm/assessments/${id}/status`, { status, score });
            return mapAssessment(data);
        },
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({ queryKey: ["assessments"] });
            queryClient.invalidateQueries({ queryKey: ["assessments", variables.id] });
        },
    });
}

export function useAssessmentAnswers(assessmentId: string) {
    return useQuery({
        queryKey: ["assessments", assessmentId, "answers"],
        queryFn: async () => {
            if (!assessmentId) return [];
            const { data } = await api.get<AssessmentAnswer[]>(`/api/trm/assessments/${assessmentId}/answers`);
            return data;
        },
        enabled: !!assessmentId,
    });
}

export function useUpsertAssessmentAnswer() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async ({ assessmentId, payload }: { assessmentId: string; payload: Partial<AssessmentAnswer> }) => {
            const { data } = await api.post(`/api/trm/assessments/${assessmentId}/answers`, payload);
            return data;
        },
        onSuccess: (_, variables) => queryClient.invalidateQueries({ queryKey: ["assessments", variables.assessmentId, "answers"] }),
    });
}
