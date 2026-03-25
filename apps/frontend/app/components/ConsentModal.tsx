"use client";

import { useState } from "react";
import { Button } from "~/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "~/components/ui/dialog";
import { Label } from "~/components/ui/label";
import { Switch } from "~/components/ui/switch";
import { ShieldCheck as ShieldCheckIcon } from "lucide-react";
import { ArcPublicAPI } from "~/lib/arc-public-sdk";

interface ConsentModalProps {
    isOpen: boolean;
    onOpenChange: (open: boolean) => void;
    onConfirm: (consents: { marketing: boolean }) => void;
    api: ArcPublicAPI;
}

export function ConsentModal({ isOpen, onOpenChange, onConfirm, api }: ConsentModalProps) {
    const [marketingConsent, setMarketingConsent] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Static texts (no translation needed for now)
    const texts = {
        title: "We Value Your Privacy",
        desc: "Please review and manage your consent preferences below.",
        privacyTitle: "Privacy Policy (Required)",
        privacyDesc: "I agree to the Terms of Service and Privacy Policy.",
        marketingTitle: "Marketing Communications",
        marketingDesc: "Receive updates, promotions, and news from Arc Platform.",
        confirmBtn: "Confirm & Continue",
        cancelBtn: "Cancel"
    };

    const handleConfirm = async () => {
        setIsSubmitting(true);
        
        try {
            // Submit consent via API
            const success = await api.submitConsent({
                analytics: true, // Always allow analytics
                marketing: marketingConsent,
                functional: true,
                strictly_necessary: true
            });

            if (success) {
                onConfirm({ marketing: marketingConsent });
                onOpenChange(false);
            } else {
                // Still proceed even if API fails, but log it
                console.warn("Consent API submission failed, but proceeding with form");
                onConfirm({ marketing: marketingConsent });
                onOpenChange(false);
            }
        } catch (error) {
            console.error("Consent submission error:", error);
            // Still proceed with form submission
            onConfirm({ marketing: marketingConsent });
            onOpenChange(false);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <ShieldCheckIcon className="w-6 h-6 text-indigo-600" />
                        {texts.title}
                    </DialogTitle>
                    <DialogDescription>
                        {texts.desc}
                    </DialogDescription>
                </DialogHeader>

                <div className="py-4 space-y-6">
                    {/* Privacy Policy (Required) */}
                    <div className="flex items-start space-x-4 p-4 bg-slate-50 rounded-lg border border-slate-100 opacity-80 cursor-not-allowed">
                        <Switch checked disabled />
                        <div className="space-y-1">
                            <Label className="text-base font-medium">{texts.privacyTitle}</Label>
                            <p className="text-sm text-slate-500 leading-snug">
                                {texts.privacyDesc}
                            </p>
                        </div>
                    </div>

                    {/* Marketing (Optional) */}
                    <div className="flex items-start space-x-4 p-4 bg-white rounded-lg border border-slate-200 hover:border-indigo-200 transition-colors">
                        <Switch
                            id="marketing"
                            checked={marketingConsent}
                            onCheckedChange={setMarketingConsent}
                        />
                        <div className="space-y-1">
                            <Label htmlFor="marketing" className="text-base font-medium cursor-pointer">{texts.marketingTitle}</Label>
                            <p className="text-sm text-slate-500 leading-snug">
                                {texts.marketingDesc}
                            </p>
                        </div>
                    </div>
                </div>

                <DialogFooter>
                    <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isSubmitting}>
                        {texts.cancelBtn}
                    </Button>
                    <Button onClick={handleConfirm} className="bg-indigo-600 hover:bg-indigo-700 text-white" disabled={isSubmitting}>
                        {isSubmitting ? "Submitting..." : texts.confirmBtn}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
