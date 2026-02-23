import axios from 'axios';
import { QueryClient } from '@tanstack/react-query';
import { useSessionStore } from '~/store/session';

// ── Axios Instance ─────────────────────────────────────────────────────────

export const api = axios.create({
    baseURL: import.meta.env.VITE_API_URL || 'http://localhost:9080', // APISIX Gateway
    headers: {
        'Content-Type': 'application/json',
    },
});

import { User } from 'oidc-client-ts';

// ── Request Interceptor ────────────────────────────────────────────────────
// Injects JWT token and tenant context into every outbound request.

api.interceptors.request.use((config) => {
    const { activeOrganization } = useSessionStore.getState();

    // Bearer token — derived from oidc-client-ts session storage
    // Keycloak OIDC via APISIX gateway at http://localhost:9080/realms/arc
    if (typeof window !== "undefined") {
        const authority = import.meta.env.VITE_KEYCLOAK_URL || "http://localhost:9080/realms/arc";
        const clientId = import.meta.env.VITE_KEYCLOAK_CLIENT_ID || "arc-frontend";
        const storageString = sessionStorage.getItem(`oidc.user:${authority}:${clientId}`);

        if (storageString) {
            try {
                const user = User.fromStorageString(storageString);
                if (user?.access_token) {
                    config.headers.Authorization = `Bearer ${user.access_token}`;
                }
            } catch (e) {
                console.error("Failed to parse OIDC user from session storage:", e);
            }
        }
    }

    // Tenant context header — consumed by APISIX and downstream services.
    if (activeOrganization?.id) {
        config.headers['X-Organization-Id'] = activeOrganization.id;
    }

    return config;
});

// ── Response Interceptor ───────────────────────────────────────────────────

import { userManager } from '~/providers/AuthProvider';

let isRedirecting = false;

api.interceptors.response.use(
    (response) => response,
    async (error) => {
        if (error.response?.status === 401) {
            if (!isRedirecting) {
                isRedirecting = true;
                console.warn("Session expired. Redirecting to login...");

                // Clear the Zustand store
                useSessionStore.getState().setUser(null);

                // Clear the OIDC session state
                await userManager.removeUser();

                // Trigger Keycloak redirect
                await userManager.signinRedirect();
            }
        }
        return Promise.reject(error);
    },
);

// ── TanStack Query Client ──────────────────────────────────────────────────

export const queryClient = new QueryClient({
    defaultOptions: {
        queries: {
            staleTime: 60 * 1000,    // 1 minute
            retry: (failureCount, error: any) => {
                if (error?.response?.status === 401 || error?.response?.status === 403) return false;
                return failureCount < 3;
            },
            refetchOnWindowFocus: false,
        },
    },
});
