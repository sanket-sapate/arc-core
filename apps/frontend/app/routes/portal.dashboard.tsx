import { useState } from "react";
import { Link, useNavigate } from "react-router";
import { Header } from "~/components/shared/Header";
import { PortalNav } from "~/components/portal/PortalNav";
import { Button } from "~/components/ui/button";
import { useUserConsents, usePortalSummary } from "~/features/user-portal/api/portal";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "~/components/ui/card";
import { ShieldCheck, FileText, AlertTriangle, ArrowRight } from "lucide-react";
import { Skeleton } from "~/components/ui/skeleton";

export default function PortalDashboard() {
    const navigate = useNavigate();
    const { data: summary, isLoading: loadingSummary, isError: errorSummary } = usePortalSummary();
    const { data: consents, isLoading: loadingConsents } = useUserConsents();

    // If unauthorized or an error occurs on load, it means the JWT is invalid/missing
    if (errorSummary) {
        return (
            <div className="min-h-screen flex flex-col bg-slate-50">
                <Header />
                <main className="flex-1 flex flex-col items-center justify-center p-8">
                    <Card className="w-full max-w-md text-center shadow-xl border-slate-200">
                        <CardHeader>
                            <CardTitle className="text-red-600">Session Expired</CardTitle>
                            <CardDescription>Your secure session has expired. Please sign in again to access your portal.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <Button className="w-full bg-indigo-600 hover:bg-indigo-700" onClick={() => navigate("/portal/login")}>
                                Go to Login
                            </Button>
                        </CardContent>
                    </Card>
                </main>
            </div>
        );
    }

    return (
        <div className="min-h-screen flex flex-col bg-slate-50">
            <Header />
            <main className="flex-1 w-full max-w-6xl mx-auto px-4 py-8 space-y-10">

                {/* Welcome Header */}
                <div className="space-y-3">
                    <h1 className="text-4xl font-extrabold tracking-tight text-slate-900">Welcome to your Portal</h1>
                    <p className="text-lg text-slate-600 max-w-2xl leading-relaxed">
                        You are in control. Manage your data preferences, review your active consents, and seamlessly exercise your privacy rights from this secure dashboard.
                    </p>
                </div>

                <PortalNav />

                {/* Summary Metric Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <Card className="shadow-sm border-indigo-100 border-t-4 border-t-indigo-500 bg-white">
                        <CardHeader className="pb-2">
                            <CardDescription className="font-medium text-indigo-700 flex items-center gap-2">
                                <ShieldCheck className="w-5 h-5" /> Active Consents
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            {loadingSummary ? (
                                <Skeleton className="h-10 w-24 rounded-md" />
                            ) : (
                                <div className="text-4xl font-bold text-slate-900">{summary?.total_consents || 0}</div>
                            )}
                        </CardContent>
                    </Card>

                    <Card className="shadow-sm border-blue-100 border-t-4 border-t-blue-500 bg-white">
                        <CardHeader className="pb-2">
                            <CardDescription className="font-medium text-blue-700 flex items-center gap-2">
                                <FileText className="w-5 h-5" /> Active Privacy Requests
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            {loadingSummary ? (
                                <Skeleton className="h-10 w-24 rounded-md" />
                            ) : (
                                <div className="text-4xl font-bold text-slate-900">{summary?.active_requests || 0}</div>
                            )}
                        </CardContent>
                    </Card>

                    <Card className="shadow-sm border-amber-100 border-t-4 border-t-amber-500 bg-white">
                        <CardHeader className="pb-2">
                            <CardDescription className="font-medium text-amber-700 flex items-center gap-2">
                                <AlertTriangle className="w-5 h-5" /> Open Grievances
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            {loadingSummary ? (
                                <Skeleton className="h-10 w-24 rounded-md" />
                            ) : (
                                <div className="text-4xl font-bold text-slate-900">{summary?.open_grievances || 0}</div>
                            )}
                        </CardContent>
                    </Card>
                </div>

                {/* Recent Activity */}
                <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-5">
                    <h3 className="text-lg font-semibold text-slate-800">Recent Activity & Consents</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {loadingConsents ? (
                            <div className="col-span-2 text-sm text-slate-500 animate-pulse">Loading recent activity...</div>
                        ) : consents && consents.length > 0 ? (
                            consents.slice(0, 4).map((consent: any) => (
                                <Card key={consent.id} className="shadow-sm hover:shadow-md transition-shadow bg-slate-50 border border-slate-100">
                                    <CardContent className="p-4 flex items-center justify-between">
                                        <div>
                                            <p className="font-medium text-slate-800">{consent.domain || "Unknown Domain"}</p>
                                            <p className="text-xs text-slate-500">Given on {new Date(consent.created_at).toLocaleDateString()}</p>
                                        </div>
                                        <ShieldCheck className="w-5 h-5 text-indigo-400" />
                                    </CardContent>
                                </Card>
                            ))
                        ) : (
                            <div className="col-span-2 p-8 text-center bg-slate-50 border border-dashed border-slate-200 rounded-xl text-slate-500">
                                No recent activity found.
                            </div>
                        )}
                    </div>
                </div>

            </main>
        </div>
    );
}
