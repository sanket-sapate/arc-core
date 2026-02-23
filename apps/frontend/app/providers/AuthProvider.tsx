import { AuthProvider as OIDCAuthProvider } from "react-oidc-context";
import { WebStorageStateStore, UserManager } from "oidc-client-ts";

const oidcConfig = {
    authority: import.meta.env.VITE_KEYCLOAK_URL || "http://localhost:9080/realms/arc",
    client_id: import.meta.env.VITE_KEYCLOAK_CLIENT_ID || "arc-frontend",
    redirect_uri: import.meta.env.VITE_CALLBACK_URL || "http://localhost:5173/auth/callback",
    response_type: "code",
    scope: "openid profile email",
    // Store OIDC user data in sessionStorage so it clears when the browser closes
    userStore: typeof window !== "undefined" ? new WebStorageStateStore({ store: window.sessionStorage }) : undefined,
    // Automatically attempt silent renew before token expiration
    automaticSilentRenew: true,
};

export const userManager = new UserManager(oidcConfig);

export function AuthProvider({ children }: { children: React.ReactNode }) {
    return <OIDCAuthProvider userManager={userManager}>{children}</OIDCAuthProvider>;
}
