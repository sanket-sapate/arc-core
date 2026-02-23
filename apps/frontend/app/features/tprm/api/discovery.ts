import { useMutation } from '@tanstack/react-query';
import { api } from '~/lib/api';
import { z } from 'zod';

export const DiscoveryScanRequestSchema = z.object({
    target_range: z.string(),
    ports: z.array(z.number()),
});

export type DiscoveryScanRequest = z.infer<typeof DiscoveryScanRequestSchema>;

export const triggerDiscoveryScan = async (payload: DiscoveryScanRequest) => {
    // Hits APISIX which proxies it to discovery-service:8080 /scans/network
    const { data } = await api.post('/api/discovery/scans/network', payload);
    return data;
};

export const useTriggerNetworkScan = () => {
    return useMutation({
        mutationFn: triggerDiscoveryScan,
    });
};
