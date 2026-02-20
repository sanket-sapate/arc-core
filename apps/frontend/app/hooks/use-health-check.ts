import { useQuery } from '@tanstack/react-query';
import { api } from '../lib/axios';

export const useHealthCheck = () => {
    return useQuery({
        queryKey: ['health'],
        queryFn: async () => {
            const { data } = await api.get('/health');
            return data;
        },
    });
};
