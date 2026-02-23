import { useQuery, useMutation } from '@tanstack/react-query';
import { api, queryClient } from '~/lib/api';
import type { Vendor } from '../types/vendor';

const mapVendor = (v: any): Vendor => ({
    id: v.ID || v.id,
    name: v.Name || v.name || "",
    description: v.Description || v.description || "",
    website: v.Website || v.website || "",
    risk_level: v.RiskLevel || v.risk_level || "medium",
    compliance_status: v.ComplianceStatus || v.compliance_status || "under_review",
    active: v.Active ?? v.active ?? true,
    requires_dpa: false, // UI only flag on creation, backend doesn't return this
    requires_assessment: false, // UI only flag on creation, backend doesn't return this
    created_at: v.CreatedAt || v.created_at,
    updated_at: v.UpdatedAt || v.updated_at,
});

export const getVendors = async (): Promise<Vendor[]> => {
    const { data } = await api.get('/api/trm/vendors');
    return (data || []).map(mapVendor);
};

export const createVendor = async (vendor: Vendor): Promise<Vendor> => {
    const payload = {
        name: vendor.name,
        contact_email: vendor.website, // Backend wants contact_email, we'll map website to it for now based on prompt constraints or just pass as is if proxy resolves it. Let's send what the backend expects but keep UI simple.
        compliance_status: vendor.compliance_status,
        risk_level: vendor.risk_level,
        description: vendor.description,
        active: vendor.active,
        website: vendor.website
    };
    const { data } = await api.post('/api/trm/vendors', payload);
    return mapVendor(data);
};

export const updateVendor = async ({ id, vendor }: { id: string; vendor: Vendor }): Promise<Vendor> => {
    const payload = {
        name: vendor.name,
        contact_email: vendor.website,
        compliance_status: vendor.compliance_status,
        risk_level: vendor.risk_level,
        description: vendor.description,
        active: vendor.active,
        website: vendor.website
    };
    const { data } = await api.put(`/api/trm/vendors/${id}`, payload);
    return mapVendor(data);
};

export const deleteVendor = async (id: string): Promise<void> => {
    await api.delete(`/api/trm/vendors/${id}`);
};

export const useVendors = () => {
    return useQuery({
        queryKey: ['vendors'],
        queryFn: getVendors,
    });
};

export const useCreateVendor = () => {
    return useMutation({
        mutationFn: createVendor,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['vendors'] });
        },
    });
};

export const useUpdateVendor = () => {
    return useMutation({
        mutationFn: updateVendor,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['vendors'] });
        },
    });
};

export const useDeleteVendor = () => {
    return useMutation({
        mutationFn: deleteVendor,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['vendors'] });
        },
    });
};

export const createVendorDPA = async (vendorId: string) => {
    return api.post(`/api/trm/vendors/${vendorId}/dpas`, {});
};

export const createVendorAssessment = async (vendorId: string) => {
    return api.post(`/api/trm/vendors/${vendorId}/assessments`, {
        // Assume default framework or status from backend, pass empty for now.
        status: "pending"
    });
};
