"use client";

import { useState, useEffect } from "react";
import { Link } from "react-router";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import { Checkbox } from "~/components/ui/checkbox";
import { toast } from "sonner";
import { ShieldCheck as ShieldCheckIcon, Server as ServerStackIcon, FileCheck as DocumentCheckIcon, Globe as GlobeAltIcon, CheckCircle as CheckCircleIcon, ArrowRight as ArrowRightIcon, Menu as Bars3Icon, X as XMarkIcon, Shield } from "lucide-react";
import { api } from "~/lib/api";

export default function LandingPage() {
    const [isMenuOpen, setIsMenuOpen] = useState(false);

    // Form State
    const [formData, setFormData] = useState({
        firstName: "",
        lastName: "",
        workEmail: "",
        companyName: "",
        marketingConsent: false
    });
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Load CMP Widget script and initialize when component mounts
    useEffect(() => {
        if (typeof window === 'undefined') return;

        // Set up configuration for the local CMP script
        window.ArcCMP = {
            id: 'f8c965ecdf3499ed9fb3343a303b8f9df5ff01e4746c4dd562f86d9635cb47df',
            cdn: window.location.origin
        };

        // Load the CMP script if not already loaded
        if (!document.querySelector('script[src*="cmp.js"]')) {
            const script = document.createElement('script');
            script.src = '/sdk/cmp.js';
            script.async = true;
            script.onload = () => {
                // The cmp.js script will automatically load cmp-core.js and initialize
                // We need to wait for CC to be available and then configure it for our form
                const checkCC = setInterval(() => {
                    if (window.CC && !window.CMP_INITIALIZED) {
                        clearInterval(checkCC);
                        
                        // Initialize with our form configuration
                        window.CC.init({
                            apiKey: 'f8c965ecdf3499ed9fb3343a303b8f9df5ff01e4746c4dd562f86d9635cb47df',
                            apiUrl: (import.meta as any).env?.VITE_PUBLIC_API_URL || 'http://localhost:8080',
                            uiUrl: '/sdk/cmp-ui.js',
                            cssUrl: '/sdk/cmp-ui.css',
                            containerId: 'arc-cmp-container',
                            autoMount: true,
                            formSelector: '#demo-form'
                        });
                        
                        window.CMP_INITIALIZED = true;
                        console.log('CMP Widget initialized for demo form');
                    }
                }, 100);

                // Timeout after 10 seconds
                setTimeout(() => clearInterval(checkCC), 10000);
            };
            document.head.appendChild(script);
        }
    }, []);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { id, value } = e.target;
        setFormData(prev => ({ ...prev, [id]: value }));
    };

    // Helper: Submit Lead to Database
    const submitLead = async (email: string, marketingConsent: boolean) => {
        const { createClient } = await import("@supabase/supabase-js");
        const supabase = createClient(
            import.meta.env.VITE_SUPABASE_URL || "https://tvalxojatdvwqtiwxcch.supabase.co",
            import.meta.env.VITE_SUPABASE_ANON_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InR2YWx4b2phdGR2d3F0aXd4Y2NoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzAxNzQxOTEsImV4cCI6MjA4NTc1MDE5MX0.zaFu3OSqOuDQtITy1fdflWT_ake4Dgi4k3eBXEOVF8U"
        );

        // Submit Lead
        const { error } = await supabase.from('leads').insert({
            first_name: formData.firstName,
            last_name: formData.lastName,
            work_email: email,
            company_name: formData.companyName,
            marketing_consent: marketingConsent,
            consent_receipt_id: null
        });

        if (error) throw error;
    };

    // Submit handler - consent is handled by CMP widget
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        setIsSubmitting(true);
        try {
            // The CMP widget will handle consent and add consent_receipt_id to form data
            // For now, we'll submit with the marketing consent from the checkbox
            await submitLead(formData.workEmail, formData.marketingConsent);

            toast("Demo Requested!", {
                description: "We have received your request. Check your email for details.",
                duration: 6000
            });

            setFormData({
                firstName: "",
                lastName: "",
                workEmail: "",
                companyName: "",
                marketingConsent: false
            });
        } catch (error) {
            console.error("Lead submission error:", error);
            toast.error("Error", { description: "Could not submit request." });
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="min-h-screen bg-slate-950 text-slate-100 font-sans selection:bg-indigo-500/30">
            {/* Navigation */}
            <nav className="fixed w-full z-50 bg-slate-950/80 backdrop-blur-md border-b border-white/5">
                <div className="container mx-auto px-6 h-20 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-600/20">
                            <ShieldCheckIcon className="w-6 h-6 text-white" />
                        </div>
                        <span className="font-bold text-xl tracking-tight">ARC Platform</span>
                    </div>

                    {/* Desktop Nav */}
                    <div className="hidden md:flex items-center gap-8 text-sm font-medium text-slate-400">
                        <Link to="#features" className="hover:text-white transition-colors">Features</Link>
                        <Link to="#compliance" className="hover:text-white transition-colors">Compliance</Link>
                        <Link to="/pixtravel-demo" className="hover:text-white transition-colors">Integrations</Link>
                        <div className="h-4 w-px bg-white/10" />
                        <Link to="/login" className="hover:text-white transition-colors">Client Login</Link>
                        <Button asChild className="bg-white text-slate-950 hover:bg-slate-200 rounded-full px-6">
                            <Link to="#demo">Request Demo</Link>
                        </Button>
                    </div>

                    {/* Mobile Toggle */}
                    <button className="md:hidden p-2 text-slate-400" onClick={() => setIsMenuOpen(!isMenuOpen)}>
                        {isMenuOpen ? <XMarkIcon className="w-6 h-6" /> : <Bars3Icon className="w-6 h-6" />}
                    </button>
                </div>

                {/* Mobile Menu */}
                {isMenuOpen && (
                    <div className="md:hidden bg-slate-900 border-b border-white/5 p-6 space-y-4">
                        <Link to="#features" className="block text-slate-400 hover:text-white" onClick={() => setIsMenuOpen(false)}>Features</Link>
                        <Link to="#compliance" className="block text-slate-400 hover:text-white" onClick={() => setIsMenuOpen(false)}>Compliance</Link>
                        <Link to="/pixtravel-demo" className="block text-slate-400 hover:text-white" onClick={() => setIsMenuOpen(false)}>Live Demo (PixTravel)</Link>
                        <Link to="/login" className="block text-slate-400 hover:text-white" onClick={() => setIsMenuOpen(false)}>Login</Link>
                    </div>
                )}
            </nav>


            {/* Hero Section */}
            <section className="relative pt-32 pb-20 lg:pt-48 lg:pb-32 overflow-hidden">
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[600px] bg-indigo-600/20 rounded-full blur-[120px] -z-10 opacity-50 pointer-events-none" />

                <div className="container mx-auto px-6 text-center max-w-4xl">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-xs font-medium text-indigo-300 mb-8 animate-in fade-in slide-in-from-bottom-4">
                        <span className="flex h-2 w-2 rounded-full bg-indigo-500 animate-pulse" />
                        Now Available: Automated Cookie Discovery
                    </div>

                    <h1 className="text-5xl lg:text-7xl font-bold tracking-tight mb-8 leading-tight animate-in fade-in slide-in-from-bottom-6 duration-700">
                        Trust as a <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-cyan-400">Service</span>
                    </h1>

                    <p className="text-lg text-slate-400 mb-12 max-w-2xl mx-auto leading-relaxed animate-in fade-in slide-in-from-bottom-8 duration-700 delay-150">
                        The all-in-one platform for Privacy, Consent, and Third-Party Risk Management.
                        Automate compliance, discover hidden risks, and build trust with your users.
                    </p>

                    <div className="flex flex-col sm:flex-row items-center justify-center gap-4 animate-in fade-in slide-in-from-bottom-8 duration-700 delay-300">
                        <Button size="lg" className="bg-indigo-600 hover:bg-indigo-500 text-white rounded-full px-8 h-12 w-full sm:w-auto text-base shadow-lg shadow-indigo-600/20" asChild>
                            <Link to="#demo">Get Started</Link>
                        </Button>
                        <Button variant="outline" size="lg" className="bg-white border-white text-slate-900 hover:bg-slate-100 hover:text-indigo-600 rounded-full px-8 h-12 w-full sm:w-auto text-base backdrop-blur-sm transition-all shadow-lg shadow-white/10" asChild>
                            <Link to="/pixtravel-demo">
                                View Live Demo <ArrowRightIcon className="w-4 h-4 ml-2" />
                            </Link>
                        </Button>
                    </div>
                </div>
            </section>

            {/* Features Grid */}
            <section id="features" className="py-24 bg-slate-900/50 border-y border-white/5">
                <div className="container mx-auto px-6">
                    <div className="text-center mb-16">
                        <h2 className="text-3xl font-bold mb-4">Unified Privacy Operations</h2>
                        <p className="text-slate-400">Everything you need to manage data privacy in one place.</p>
                    </div>

                    <div className="grid md:grid-cols-3 gap-8">
                        <div className="p-8 rounded-2xl bg-slate-950 border border-white/5 hover:border-indigo-500/30 hover:shadow-2xl hover:shadow-indigo-500/10 transition-all duration-300 group">
                            <div className="w-12 h-12 bg-indigo-500/10 rounded-lg flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                                <ServerStackIcon className="w-6 h-6 text-indigo-400" />
                            </div>
                            <h3 className="text-xl font-semibold mb-3">Data Discovery</h3>
                            <p className="text-slate-400 leading-relaxed">
                                Connect your data sources and automatically map PII. visualize data flows and generate ROPA reports instantly.
                            </p>
                        </div>

                        <div className="p-8 rounded-2xl bg-slate-950 border border-white/5 hover:border-cyan-500/30 hover:shadow-2xl hover:shadow-cyan-500/10 transition-all duration-300 group">
                            <div className="w-12 h-12 bg-cyan-500/10 rounded-lg flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                                <GlobeAltIcon className="w-6 h-6 text-cyan-400" />
                            </div>
                            <h3 className="text-xl font-semibold mb-3">Universal Consent</h3>
                            <p className="text-slate-400 leading-relaxed">
                                Deploy compliant cookie banners and consent forms. Sync preferences across all your domains and applications.
                            </p>
                        </div>

                        <div className="p-8 rounded-2xl bg-slate-950 border border-white/5 hover:border-rose-500/30 hover:shadow-2xl hover:shadow-rose-500/10 transition-all duration-300 group">
                            <div className="w-12 h-12 bg-rose-500/10 rounded-lg flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                                <DocumentCheckIcon className="w-6 h-6 text-rose-400" />
                            </div>
                            <h3 className="text-xl font-semibold mb-3">Vendor Risk (TPRM)</h3>
                            <p className="text-slate-400 leading-relaxed">
                                Assess vendor security posture, automate DPA workflows, and monitor compliance in real-time.
                            </p>
                        </div>
                    </div>
                </div>
            </section>

            {/* Trust Section */}
            <section id="compliance" className="py-24">
                <div className="container mx-auto px-6">
                    <div className="flex flex-col lg:flex-row items-center gap-16">
                        <div className="lg:w-1/2">
                            <h2 className="text-3xl font-bold mb-6 leading-tight">
                                Compliance Built for <br />
                                <span className="text-indigo-400">Global Standards</span>
                            </h2>
                            <p className="text-slate-400 text-lg mb-8">
                                Navigate the complex landscape of GDPR, CCPA, and DPDPA with confidence.
                                Arc Platform updates automatically as regulations change.
                            </p>

                            <div className="space-y-4">
                                {['GDPR & CCPA Ready', 'Automated DSR Fulfillment', 'Real-time Audit Logs', 'Cross-border Data Mapping'].map((item) => (
                                    <div key={item} className="flex items-center gap-3">
                                        <CheckCircleIcon className="w-5 h-5 text-emerald-500" />
                                        <span className="text-slate-300">{item}</span>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="lg:w-1/2 relative">
                            <div className="absolute inset-0 bg-gradient-to-r from-indigo-500 to-cyan-500 blur-[60px] opacity-20" />
                            <div className="relative bg-slate-900 border border-white/10 rounded-2xl p-8 shadow-2xl">
                                <div className="flex justify-between items-center mb-8 border-b border-white/5 pb-4">
                                    <div className="text-sm font-medium text-slate-400">Compliance Score</div>
                                    <div className="text-2xl font-bold text-emerald-400">98%</div>
                                </div>
                                <div className="space-y-6">
                                    {[
                                        { label: "Cookie Consent", score: 100, color: "bg-emerald-500" },
                                        { label: "Vendor Assessments", score: 92, color: "bg-emerald-500" },
                                        { label: "Data Mapping", score: 96, color: "bg-emerald-500" },
                                        { label: "Breach Readiness", score: 100, color: "bg-emerald-500" }
                                    ].map((metric) => (
                                        <div key={metric.label}>
                                            <div className="flex justify-between text-sm mb-2">
                                                <span className="text-slate-300">{metric.label}</span>
                                                <span className="text-slate-400">{metric.score}%</span>
                                            </div>
                                            <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
                                                <div
                                                    className={`h-full ${metric.color} rounded-full transition-all duration-1000`}
                                                    style={{ width: `${metric.score}%` }}
                                                />
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Lead Form Section */}
            <section id="demo" className="py-24 bg-gradient-to-b from-slate-900 to-slate-950 border-t border-white/5">
                <div className="container mx-auto px-6 max-w-5xl">
                    <div className="grid md:grid-cols-2 gap-16 items-center">
                        <div>
                            <h2 className="text-3xl font-bold mb-6">Ready to secure your data?</h2>
                            <p className="text-slate-400 mb-8">
                                Schedule a personalized demo with our privacy experts. See how Arc can transform your compliance operations.
                            </p>
                            <div className="bg-slate-800/50 p-6 rounded-xl border border-white/5">
                                <blockquote className="text-lg italic text-slate-300 mb-4">
                                    "Arc Platform reduced our prolonged vendor assessment cycles from weeks to just days. It's a game changer."
                                </blockquote>
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 bg-slate-700 rounded-full" />
                                    <div>
                                        <div className="font-semibold text-white">Sarah Jenkins</div>
                                        <div className="text-sm text-slate-500">CISO, FinTech Global</div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="bg-white rounded-2xl p-8 shadow-xl">
                            <h3 className="text-xl font-bold text-slate-900 mb-6">Request a Demo</h3>

                            <form id="demo-form" onSubmit={handleSubmit} className="space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="firstName" className="text-slate-700">First Name</Label>
                                        <Input
                                            id="firstName"
                                            value={formData.firstName}
                                            onChange={handleInputChange}
                                            className="bg-slate-50 border-slate-200 text-slate-900"
                                            required
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="lastName" className="text-slate-700">Last Name</Label>
                                        <Input
                                            id="lastName"
                                            value={formData.lastName}
                                            onChange={handleInputChange}
                                            className="bg-slate-50 border-slate-200 text-slate-900"
                                            required
                                        />
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="workEmail" className="text-slate-700">Work Email</Label>
                                    <Input
                                        id="workEmail"
                                        type="email"
                                        value={formData.workEmail}
                                        onChange={handleInputChange}
                                        className="bg-slate-50 border-slate-200 text-slate-900"
                                        data-cmp-consent-id="marketing_opt_in"
                                        required
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="companyName" className="text-slate-700">Company Name</Label>
                                    <Input
                                        id="companyName"
                                        value={formData.companyName}
                                        onChange={handleInputChange}
                                        className="bg-slate-50 border-slate-200 text-slate-900"
                                        required
                                    />
                                </div>

                                <div className="pt-2">
                                    <div className="flex items-start gap-3">
                                        <Checkbox
                                            id="marketingConsent"
                                            checked={formData.marketingConsent}
                                            // @ts-ignore
                                            onCheckedChange={(checked) => setFormData(prev => ({ ...prev, marketingConsent: checked as boolean }))}
                                        />
                                        <div className="grid gap-1.5 leading-none">
                                            <Label
                                                htmlFor="marketingConsent"
                                                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 text-slate-600"
                                            >
                                                I agree to receive marketing communications from Arc.
                                            </Label>
                                            <p className="text-xs text-slate-500">
                                                We use the <strong>ARC Public API</strong> to securely record this consent.
                                                You can withdraw it at any time.
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                <Button
                                    type="submit"
                                    className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold h-12 text-base mt-2 shadow-lg shadow-indigo-600/20"
                                    disabled={isSubmitting}
                                >
                                    {isSubmitting ? "Submitting..." : "Schedule Demo"}
                                </Button>
                            </form>
                        </div>
                    </div>
                </div>
            </section>

            {/* Footer */}
            <footer className="py-12 bg-slate-950 border-t border-white/5 text-sm text-slate-500 text-center">
                <p>© 2026 Arc Platform. All rights reserved.</p>
                <div className="flex justify-center gap-6 mt-4">
                    <Link to="#" className="hover:text-white">Privacy Policy</Link>
                    <Link to="#" className="hover:text-white">Terms of Service</Link>
                    <Link to="#" className="hover:text-white">Contact</Link>
                </div>
            </footer>
        </div>
    );
}
