import { useQuery, useMutation } from '@tanstack/react-query';
import { api, queryClient } from '~/lib/api';
import type { CookieBanner } from '../types/banner';

const mapBanner = (b: any): CookieBanner => ({
    id: b.ID || b.id,
    domain: b.Domain || b.domain || "",
    name: b.Name || b.name || "",
    title: b.Title || b.title || "",
    message: b.Message || b.message || "",
    accept_button_text: b.AcceptButtonText || b.accept_button_text || "Accept All",
    reject_button_text: b.RejectButtonText || b.reject_button_text || "Reject All",
    settings_button_text: b.SettingsButtonText || b.settings_button_text || "Settings",
    theme: b.Theme || b.theme || "light",
    position: b.Position || b.position || "bottom",
    active: b.Active ?? b.active ?? true,
    created_at: b.CreatedAt || b.created_at,
    updated_at: b.UpdatedAt || b.updated_at,
});

export const getBanners = async (): Promise<CookieBanner[]> => {
    const { data } = await api.get('/api/privacy/api/v1/cookie-banners');
    return (data || []).map(mapBanner);
};

export const createBanner = async (banner: CookieBanner): Promise<CookieBanner> => {
    const { data } = await api.post('/api/privacy/api/v1/cookie-banners', banner);
    return mapBanner(data);
};

export const updateBanner = async ({ id, banner }: { id: string; banner: CookieBanner }): Promise<CookieBanner> => {
    const { data } = await api.put(`/api/privacy/api/v1/cookie-banners/${id}`, banner);
    return mapBanner(data);
};

export const deleteBanner = async (id: string): Promise<void> => {
    await api.delete(`/api/privacy/api/v1/cookie-banners/${id}`);
};

export const useBanners = () => {
    return useQuery({
        queryKey: ['banners'],
        queryFn: getBanners,
    });
};

export const useCreateBanner = () => {
    return useMutation({
        mutationFn: createBanner,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['banners'] });
        },
    });
};

export const useUpdateBanner = () => {
    return useMutation({
        mutationFn: updateBanner,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['banners'] });
        },
    });
};

export const useDeleteBanner = () => {
    return useMutation({
        mutationFn: deleteBanner,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['banners'] });
        },
    });
};
