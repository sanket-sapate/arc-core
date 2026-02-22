import { useEffect } from 'react';
import { useNavigate } from 'react-router';
import { useAuth } from 'react-oidc-context';
import { Loader2 } from 'lucide-react';

export default function AuthCallback() {
    const auth = useAuth();
    const navigate = useNavigate();

    useEffect(() => {
        // Once Keycloak successfully redirects back and oidc-client finishes processing the code,
        // auth.isAuthenticated will become true.
        if (auth.isAuthenticated) {
            navigate('/', { replace: true });
        }
    }, [auth.isAuthenticated, navigate]);

    if (auth.error) {
        return (
            <div className="flex h-screen w-full flex-col items-center justify-center gap-4">
                <h1 className="text-xl font-bold text-destructive">Authentication Error</h1>
                <p className="text-sm text-muted-foreground">{auth.error.message}</p>
                <button
                    onClick={() => auth.signinRedirect()}
                    className="mt-4 px-4 py-2 bg-primary text-primary-foreground rounded-md text-sm font-medium hover:bg-primary/90"
                >
                    Try Again
                </button>
            </div>
        );
    }

    return (
        <div className="flex h-screen w-full flex-col items-center justify-center gap-4">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="text-sm text-muted-foreground animate-pulse">Completing login...</p>
        </div>
    );
}
