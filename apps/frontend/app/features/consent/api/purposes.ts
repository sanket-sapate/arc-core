import { useQuery, useMutation } from '@tanstack/react-query';
import { api, queryClient } from '~/lib/api';
import type { Purpose } from '../types/purpose';

const mapPurpose = (p: any): Purpose => ({
    id: p.ID || p.id,
    name: p.Name || p.name || "",
    description: p.Description || p.description || "",
    legal_basis: p.LegalBasis || p.legal_basis || "consent",
    active: p.Active ?? p.active ?? true,
    data_objects: p.DataObjects || p.data_objects || [],
    created_at: p.CreatedAt || p.created_at,
    updated_at: p.UpdatedAt || p.updated_at,
});

export const getPurposes = async (): Promise<Purpose[]> => {
    const { data } = await api.get('/api/privacy/api/v1/purposes');
    return (data || []).map(mapPurpose);
};

export const createPurpose = async (purpose: Purpose): Promise<Purpose> => {
    const payload = {
        name: purpose.name,
        description: purpose.description,
        legal_basis: purpose.legal_basis,
        active: purpose.active,
        data_objects: purpose.data_objects,
    };
    const { data } = await api.post('/api/privacy/api/v1/purposes', payload);
    return mapPurpose(data);
};

export const updatePurpose = async ({ id, purpose }: { id: string; purpose: Purpose }): Promise<Purpose> => {
    const payload = {
        name: purpose.name,
        description: purpose.description,
        legal_basis: purpose.legal_basis,
        active: purpose.active,
        data_objects: purpose.data_objects,
    };
    const { data } = await api.put(`/api/privacy/api/v1/purposes/${id}`, payload);
    return mapPurpose(data);
};

// Assuming privacy-service supports delete for purposes, though it wasn't strictly mentioned in the prompt. We'll add the hook just in case for consistency.
export const deletePurpose = async (id: string): Promise<void> => {
    await api.delete(`/api/privacy/api/v1/purposes/${id}`);
};

export const usePurposes = () => {
    return useQuery({
        queryKey: ['purposes'],
        queryFn: getPurposes,
    });
};

export const useCreatePurpose = () => {
    return useMutation({
        mutationFn: createPurpose,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['purposes'] });
        },
    });
};

export const useUpdatePurpose = () => {
    return useMutation({
        mutationFn: updatePurpose,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['purposes'] });
        },
    });
};

export const useDeletePurpose = () => {
    return useMutation({
        mutationFn: deletePurpose,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['purposes'] });
        },
    });
};
