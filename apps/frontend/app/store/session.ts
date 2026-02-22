import { create } from 'zustand';

// ── Types ──────────────────────────────────────────────────────────────────

export interface User {
    id: string;
    email: string;
    name: string;
}

export interface Organization {
    id: string;
    name: string;
}

interface SessionState {
    user: User | null;
    activeOrganization: Organization | null;
    availableOrganizations: Organization[];
    setUser: (user: User | null) => void;
    setActiveOrganization: (orgId: string) => void;
    setAvailableOrganizations: (orgs: Organization[]) => void;
}

// ── Store ──────────────────────────────────────────────────────────────────

export const useSessionStore = create<SessionState>((set, get) => ({
    user: null,
    activeOrganization: null,
    availableOrganizations: [],

    setUser: (user) => set({ user }),

    setActiveOrganization: (orgId) => {
        const org = get().availableOrganizations.find((o) => o.id === orgId) ?? null;
        set({ activeOrganization: org });
    },

    setAvailableOrganizations: (orgs) => {
        set({ availableOrganizations: orgs });
        // Auto-select the first org if none is active yet.
        if (!get().activeOrganization && orgs.length > 0) {
            set({ activeOrganization: orgs[0] });
        }
    },
}));
