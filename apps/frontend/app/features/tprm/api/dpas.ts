import { useQuery, useMutation } from '@tanstack/react-query';
import { api, queryClient } from '~/lib/api';
import type { Dpa } from '../types/dpa';

const mapDpa = (d: any): Dpa => ({
    id: d.ID || d.id,
    vendor_id: d.VendorID || d.vendor_id,
    status: d.Status || d.status || "draft",
    effective_date: d.EffectiveDate || d.effective_date || "",
    notes: d.Notes || d.notes || "",
    created_at: d.CreatedAt || d.created_at,
    updated_at: d.UpdatedAt || d.updated_at,
});

export const getDPAs = async (): Promise<Dpa[]> => {
    const { data } = await api.get('/api/trm/dpas');
    return (data || []).map(mapDpa);
};

export const createDPA = async (dpa: Dpa): Promise<Dpa> => {
    // The TRM backend historically nests DPA creation under the vendor
    // However, if the requirements say `/api/trm/dpas` we use that structure, 
    // but the backend handler is usually `/api/trm/vendors/:vendor_id/dpas`
    // We will send standard payload and map in backend if needed.
    const payload = {
        vendor_id: dpa.vendor_id,
        status: dpa.status,
        effective_date: dpa.effective_date,
        notes: dpa.notes
    };
    const { data } = await api.post('/api/trm/dpas', payload);
    return mapDpa(data);
};

export const updateDPA = async ({ id, dpa }: { id: string; dpa: Dpa }): Promise<Dpa> => {
    const payload = {
        vendor_id: dpa.vendor_id,
        status: dpa.status,
        effective_date: dpa.effective_date,
        notes: dpa.notes
    };
    const { data } = await api.put(`/api/trm/dpas/${id}`, payload);
    return mapDpa(data);
};

export const deleteDPA = async (id: string): Promise<void> => {
    await api.delete(`/api/trm/dpas/${id}`);
};

export const useDPAs = () => {
    return useQuery({
        queryKey: ['dpas'],
        queryFn: getDPAs,
    });
};

export const useCreateDPA = () => {
    return useMutation({
        mutationFn: createDPA,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['dpas'] });
        },
    });
};

export const useUpdateDPA = () => {
    return useMutation({
        mutationFn: updateDPA,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['dpas'] });
        },
    });
};

export const useDeleteDPA = () => {
    return useMutation({
        mutationFn: deleteDPA,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['dpas'] });
        },
    });
};
