import { useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router";
import { Header } from "~/components/shared/Header";
import { useVerifyMagicLink } from "~/features/user-portal/api/auth";

export default function PortalVerify() {
    const [searchParams] = useSearchParams();
    const token = searchParams.get("token");
    const navigate = useNavigate();
    const { mutate: verifyLink, isPending, isError, error, isSuccess } = useVerifyMagicLink();

    useEffect(() => {
        if (token && !isPending && !isError && !isSuccess) {
            verifyLink(token);
        }
    }, [token, verifyLink, isPending, isError, isSuccess]);

    useEffect(() => {
        if (isSuccess) {
            // Redirect to dashboard on successful verification
            const timer = setTimeout(() => {
                navigate("/portal/dashboard");
            }, 1500);
            return () => clearTimeout(timer);
        }
    }, [isSuccess, navigate]);

    return (
        <div className="min-h-screen flex flex-col bg-slate-50">
            <Header />
            <main className="flex-1 flex items-center justify-center p-8 container mx-auto">
                <div className="max-w-md w-full p-8 bg-white border rounded-xl shadow-sm text-center space-y-4">
                    {!token ? (
                        <div className="text-red-500 font-medium">Invalid magic link (Missing token).</div>
                    ) : isPending ? (
                        <div className="space-y-4">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-slate-900 mx-auto"></div>
                            <p className="text-slate-600 font-medium">Verifying your secure link...</p>
                        </div>
                    ) : isError ? (
                        <div className="text-red-500 space-y-2">
                            <p className="font-semibold text-lg">Verification Failed</p>
                            <p className="text-sm">{(error as any)?.response?.data?.error || "Invalid or expired magic link."}</p>
                        </div>
                    ) : isSuccess ? (
                        <div className="text-green-600 space-y-2">
                            <p className="font-semibold text-lg">Successfully Authenticated</p>
                            <p className="text-sm">Redirecting to your dashboard...</p>
                        </div>
                    ) : null}
                </div>
            </main>
        </div>
    );
}
