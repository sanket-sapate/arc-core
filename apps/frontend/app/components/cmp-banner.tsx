"use client";

import { Button } from "~/components/ui/button";
import { Shield, Lock, BarChart3, Megaphone, CheckCircle } from "lucide-react";

interface CMPBannerProps {
    isOpen: boolean;
    purposes: { id: string; label: string; description: string; required?: boolean }[];
    onConsent: () => void;
    onDecline: () => void;
    isRecording?: boolean;
}

export function CMPBanner({ isOpen, purposes, onConsent, onDecline, isRecording }: CMPBannerProps) {
    if (!isOpen) return null;

    const purposeIcons: Record<string, React.ReactNode> = {
        strictly_necessary: <Lock className="w-4 h-4 text-emerald-500" />,
        analytics: <BarChart3 className="w-4 h-4 text-blue-500" />,
        marketing: <Megaphone className="w-4 h-4 text-orange-500" />,
        functional: <CheckCircle className="w-4 h-4 text-violet-500" />,
    };

    return (
        <div className="fixed bottom-0 left-0 w-full z-50 p-0 animate-in slide-in-from-bottom duration-500">
            <div className="bg-white/95 backdrop-blur-xl border-t border-slate-200 shadow-2xl shadow-black/20">
                <div className="container mx-auto max-w-5xl px-6 py-5">
                    <div className="flex items-start gap-4 mb-4">
                        <div className="p-2.5 bg-indigo-100 rounded-xl shrink-0">
                            <Shield className="w-6 h-6 text-indigo-600" />
                        </div>
                        <div>
                            <h3 className="font-bold text-lg text-slate-900">We respect your privacy</h3>
                            <p className="text-sm text-slate-500 mt-0.5">
                                We use cookies and collect data for the following purposes. 
                                Your consent is required before you can submit any forms on this page.
                            </p>
                        </div>
                    </div>

                    {/* Explicit Purpose List */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-5 ml-0 md:ml-14">
                        {purposes.map((purpose) => (
                            <div
                                key={purpose.id}
                                className="flex items-start gap-2.5 p-2.5 rounded-lg bg-slate-50 border border-slate-100"
                            >
                                <span className="mt-0.5 shrink-0">{purposeIcons[purpose.id] || <CheckCircle className="w-4 h-4 text-slate-400" />}</span>
                                <div>
                                    <span className="text-sm font-semibold text-slate-800">{purpose.label}</span>
                                    {purpose.required && (
                                        <span className="ml-1.5 text-[10px] font-medium uppercase tracking-wide text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded">Always on</span>
                                    )}
                                    <p className="text-xs text-slate-500 leading-snug mt-0.5">{purpose.description}</p>
                                </div>
                            </div>
                        ))}
                    </div>

                    <div className="flex flex-col sm:flex-row gap-3 justify-end ml-0 md:ml-14">
                        <Button
                            variant="outline"
                            onClick={onDecline}
                            disabled={isRecording}
                            className="text-slate-600 hover:text-slate-900 border-slate-200 hover:bg-slate-50 rounded-full px-6"
                        >
                            Decline Optional
                        </Button>
                        <Button
                            onClick={onConsent}
                            disabled={isRecording}
                            className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-full px-8 shadow-lg shadow-indigo-600/20"
                        >
                            {isRecording ? (
                                <span className="flex items-center gap-2">
                                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                    Recording Consent...
                                </span>
                            ) : (
                                "Accept All & Continue"
                            )}
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );
}
