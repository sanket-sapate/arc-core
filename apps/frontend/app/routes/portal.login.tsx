import { useState } from "react";
import { Header } from "~/components/shared/Header";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { useRequestMagicLink } from "~/features/user-portal/api/auth";
import { Shield, LockKeyhole, MailCheck } from "lucide-react";

export default function PortalLogin() {
    const [email, setEmail] = useState("");
    const { mutate: requestLink, isPending, isSuccess, isError, error } = useRequestMagicLink();

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (email) {
            requestLink(email);
        }
    };

    return (
        <div className="min-h-screen flex flex-col bg-slate-50">
            <Header />
            <main className="flex-1 flex w-full">
                {/* Left Side: Branding / Info */}
                <div className="hidden lg:flex w-1/2 bg-indigo-900 text-white p-12 flex-col justify-center relative overflow-hidden">
                    {/* Background graphics */}
                    <div className="absolute top-0 left-0 w-full h-full opacity-10 pointer-events-none">
                        <div className="absolute -top-24 -left-24 w-96 h-96 bg-indigo-500 rounded-full blur-3xl" />
                        <div className="absolute bottom-0 right-0 w-[500px] h-[500px] bg-indigo-600 rounded-full blur-3xl opacity-50" />
                    </div>

                    <div className="relative z-10 max-w-lg mx-auto space-y-8">
                        <Shield className="w-16 h-16 text-indigo-300 mb-8" />
                        <h1 className="text-5xl font-extrabold tracking-tight leading-tight">
                            Welcome to your Privacy Portal
                        </h1>
                        <p className="text-xl text-indigo-200 leading-relaxed">
                            Take control of your personal data. Easily manage your consents, review your data, and exercise your privacy rights in one secure place.
                        </p>
                        <div className="flex items-center gap-4 text-indigo-300 pt-8">
                            <LockKeyhole className="w-6 h-6" />
                            <span className="font-medium">Secure, passwordless authentication.</span>
                        </div>
                    </div>
                </div>

                {/* Right Side: Form */}
                <div className="w-full lg:w-1/2 flex items-center justify-center p-8 lg:p-12">
                    <div className="max-w-md w-full p-8 bg-white border border-slate-100 rounded-2xl shadow-xl space-y-8 relative z-10">
                        <div className="text-center space-y-3">
                            <h2 className="text-3xl font-bold tracking-tight text-slate-900">Sign In</h2>
                            <p className="text-slate-500 leading-relaxed">
                                Enter your email address below to receive a secure, one-time magic link. No passwords required.
                            </p>
                        </div>

                        {isSuccess ? (
                            <div className="p-6 bg-green-50 text-green-800 rounded-xl border border-green-200 flex flex-col items-center text-center space-y-4 slide-in-from-bottom-2 animate-in fade-in">
                                <div className="p-3 bg-green-100 rounded-full">
                                    <MailCheck className="w-8 h-8 text-green-600" />
                                </div>
                                <div>
                                    <p className="font-semibold text-lg">Check your email!</p>
                                    <p className="text-sm mt-1 text-green-700">
                                        We've sent a secure login link to <span className="font-medium text-green-900">{email}</span>.
                                    </p>
                                </div>
                            </div>
                        ) : (
                            <form onSubmit={handleSubmit} className="space-y-6">
                                <div className="space-y-2">
                                    <Input
                                        type="email"
                                        required
                                        placeholder="name@example.com"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        disabled={isPending}
                                        className="w-full h-12 px-4 text-base rounded-xl border-slate-200 shadow-sm focus-visible:ring-indigo-500"
                                    />
                                </div>

                                {isError && (
                                    <div className="text-sm text-red-600 bg-red-50 p-3 rounded-lg border border-red-100 font-medium text-center">
                                        {(error as any)?.response?.data?.error || "Failed to request link. Please try again."}
                                    </div>
                                )}

                                <Button
                                    type="submit"
                                    className="w-full h-12 text-base font-medium rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white transition-colors shadow-md"
                                    disabled={isPending || !email}
                                >
                                    {isPending ? "Sending Secure Link..." : "Send Magic Link"}
                                </Button>
                                <p className="text-center text-xs text-slate-400 mt-6">
                                    By signing in, you agree to our Terms of Service and Privacy Policy.
                                </p>
                            </form>
                        )}
                    </div>
                </div>
            </main>
        </div>
    );
}
