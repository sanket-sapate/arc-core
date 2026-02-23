import { useMutation } from "@tanstack/react-query";
import { api } from "~/lib/api";

export function useRequestMagicLink() {
    return useMutation({
        mutationFn: async (email: string) => {
            const { data } = await api.post("/api/portal/auth/request", { email });
            return data;
        },
    });
}

export function useVerifyMagicLink() {
    return useMutation({
        mutationFn: async (token: string) => {
            // withCredentials ensures the HttpOnly cookie is securely stored by the browser
            const { data } = await api.post(
                "/api/portal/auth/verify",
                { token },
                { withCredentials: true }
            );
            return data;
        },
    });
}
