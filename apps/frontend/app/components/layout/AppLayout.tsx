import { Outlet } from 'react-router';
import { SidebarInset, SidebarProvider, SidebarTrigger } from '~/components/ui/sidebar';
import { Separator } from '~/components/ui/separator';
import { AppSidebar } from '~/components/layout/Sidebar';
import { useAuth } from 'react-oidc-context';
import { useQuery } from '@tanstack/react-query';
import { useSessionStore } from '~/store/session';
import { api } from '~/lib/api';
import { Loader2 } from 'lucide-react';
import { useEffect } from 'react';

// Define expected interface from iam-service for the current user
interface IAMUserResponse {
    user: {
        id: string;
        email: string;
        first_name: string;
        last_name: string;
        is_active: boolean;
    };
    organizations: {
        id: string;
        name: string;
        slug: string;
        tier: string;
    }[];
}

export default function AppLayout() {
    const auth = useAuth();
    const { activeOrganization, setUser, setAvailableOrganizations, setActiveOrganization } = useSessionStore();

    // 1. OIDC Sign-in Redirect Guard
    useEffect(() => {
        if (!auth.isLoading && !auth.isAuthenticated && !auth.activeNavigator) {
            auth.signinRedirect();
        }
    }, [auth]);

    // 2. Post-Login Synchronization: Fetch user context from backend
    const { data: userContext, isLoading: isContextLoading } = useQuery({
        queryKey: ['iam-me'],
        queryFn: async () => {
            const { data } = await api.get<IAMUserResponse>('/api/v1/iam/users/me');
            return data;
        },
        enabled: auth.isAuthenticated && !activeOrganization, // Only fetch if authenticated but Zustand store is empty
    });

    // Hydrate Zustand store when the query resolves successfully
    useEffect(() => {
        if (userContext) {
            setUser({
                id: userContext.user.id,
                email: userContext.user.email,
                name: `${userContext.user.first_name} ${userContext.user.last_name}`.trim(),
            });
            setAvailableOrganizations(userContext.organizations);
            if (userContext.organizations.length > 0) {
                // Automatically select the first organization if none is active
                setActiveOrganization(userContext.organizations[0].id);
            }
        }
    }, [userContext, setUser, setAvailableOrganizations, setActiveOrganization]);

    // 3. Render loading gates
    if (auth.isLoading || auth.activeNavigator) {
        return (
            <div className="flex h-screen w-full items-center justify-center flex-col gap-4">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <p className="text-sm text-muted-foreground animate-pulse">Authenticating with Keycloak...</p>
            </div>
        );
    }

    if (!auth.isAuthenticated) {
        return null; // The useEffect signinRedirect will trigger immediately
    }

    if (!activeOrganization && isContextLoading) {
        return (
            <div className="flex h-screen w-full items-center justify-center flex-col gap-4">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <p className="text-sm text-muted-foreground animate-pulse">Loading core workspace...</p>
            </div>
        );
    }

    // Edge case if user has no assigned organizations gracefully handle it
    if (!activeOrganization && !isContextLoading) {
        return (
            <div className="flex h-screen w-full items-center justify-center flex-col gap-2">
                <h2 className="text-lg font-semibold text-destructive">No Organizations Found</h2>
                <p className="text-sm text-muted-foreground">Your account is not assigned to any organizations.</p>
            </div>
        )
    }

    return (
        <SidebarProvider>
            <AppSidebar />

            <SidebarInset>
                {/* ── Top bar ──────────────────────────────────────────────── */}
                <header className="flex h-14 shrink-0 items-center gap-2 border-b px-4">
                    <SidebarTrigger className="-ml-1" />
                    <Separator orientation="vertical" className="mr-2 h-4!" />
                    <div className="flex flex-col">
                        <h1 className="text-sm font-medium">ARC GRC Platform</h1>
                        {activeOrganization && (
                            <span className="text-[10px] text-muted-foreground uppercase absolute right-4 md:right-8 truncate max-w-[200px]">
                                Active Org: {activeOrganization.name}
                            </span>
                        )}
                    </div>
                </header>

                {/* ── Main content area ────────────────────────────────────── */}
                <main className="flex-1 overflow-y-auto p-6">
                    <Outlet />
                </main>
            </SidebarInset>
        </SidebarProvider>
    );
}
