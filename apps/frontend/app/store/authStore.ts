import { create } from 'zustand';

interface AuthState {
    token: string | null;
    orgId: string;
    setToken: (token: string) => void;
    clearToken: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
    token: null,
    orgId: '22222222-2222-2222-2222-222222222222', // Seeded test organization
    // orgId: '99999999-9999-9999-9999-999999999999', // Seeded test organization
    setToken: (token) => set({ token }),
    clearToken: () => set({ token: null }),
}));
