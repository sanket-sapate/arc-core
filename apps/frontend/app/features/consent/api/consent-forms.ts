import { useQuery, useMutation } from '@tanstack/react-query';
import { api, queryClient } from '~/lib/api';
import type { ConsentForm } from '../types/consent-form';

const mapConsentForm = (f: any): ConsentForm => ({
    id: f.ID || f.id,
    name: f.Name || f.name || "",
    description: f.Description || f.description || "",
    active: f.Active ?? f.active ?? true,
    purpose_ids: f.Purposes || f.purposes || f.purpose_ids || [],
    created_at: f.CreatedAt || f.created_at,
    updated_at: f.UpdatedAt || f.updated_at,
});

export const getConsentForms = async (): Promise<ConsentForm[]> => {
    const { data } = await api.get('/api/privacy/api/v1/consent-forms');
    return (data || []).map(mapConsentForm);
};

export const createConsentForm = async (form: ConsentForm): Promise<ConsentForm> => {
    const payload = {
        name: form.name,
        description: form.description,
        active: form.active,
        purposes: form.purpose_ids,
        form_config: {},
    };
    const { data } = await api.post('/api/privacy/api/v1/consent-forms', payload);
    return mapConsentForm(data);
};

export const updateConsentForm = async ({ id, form }: { id: string; form: ConsentForm }): Promise<ConsentForm> => {
    const payload = {
        name: form.name,
        description: form.description,
        active: form.active,
        purposes: form.purpose_ids,
        form_config: {},
    };
    const { data } = await api.put(`/api/privacy/api/v1/consent-forms/${id}`, payload);
    return mapConsentForm(data);
};

export const deleteConsentForm = async (id: string): Promise<void> => {
    await api.delete(`/api/privacy/api/v1/consent-forms/${id}`);
};

export const useConsentForms = () => {
    return useQuery({
        queryKey: ['consent-forms'],
        queryFn: getConsentForms,
    });
};

export const useCreateConsentForm = () => {
    return useMutation({
        mutationFn: createConsentForm,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['consent-forms'] });
        },
    });
};

export const useUpdateConsentForm = () => {
    return useMutation({
        mutationFn: updateConsentForm,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['consent-forms'] });
        },
    });
};

export const useDeleteConsentForm = () => {
    return useMutation({
        mutationFn: deleteConsentForm,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['consent-forms'] });
        },
    });
};
