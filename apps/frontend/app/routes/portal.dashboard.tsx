import { useState } from "react";
import { Link, useNavigate } from "react-router";
import { Header } from "~/components/shared/Header";
import { PortalNav } from "~/components/portal/PortalNav";
import { Button } from "~/components/ui/button";
import { useUserConsents, usePortalSummary, useUserRequests, useUserGrievances } from "~/features/user-portal/api/portal";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "~/components/ui/card";
import { ShieldCheck, FileText, AlertTriangle, ArrowRight, MessageSquare } from "lucide-react";
import { Skeleton } from "~/components/ui/skeleton";

export default function PortalDashboard() {
    const navigate = useNavigate();
    const { data: summary, isLoading: loadingSummary, isError: errorSummary } = usePortalSummary();
    const { data: consents, isLoading: loadingConsents } = useUserConsents();
    const { data: requests, isLoading: loadingRequests } = useUserRequests();
    const { data: grievances, isLoading: loadingGrievances } = useUserGrievances();

    // Debug logging
    console.log('Dashboard data:', { summary, consents, requests, grievances });

    // If unauthorized or an error occurs on load, it means the JWT is invalid/missing
    if (errorSummary) {
        return (
            <div className="min-h-screen flex flex-col bg-background">
                <Header />
                <main className="flex-1 flex flex-col items-center justify-center p-8">
                    <Card className="w-full max-w-md text-center shadow-xl border">
                        <CardHeader>
                            <CardTitle className="text-destructive">Session Expired</CardTitle>
                            <CardDescription className="text-foreground">Your secure session has expired. Please sign in again to access your portal.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <Button className="w-full bg-primary hover:bg-primary/90" onClick={() => navigate("/portal/login")}>
                                Go to Login
                            </Button>
                        </CardContent>
                    </Card>
                </main>
            </div>
        );
    }

    return (
        <div className="min-h-screen flex flex-col bg-background">
            <Header />
            <main className="flex-1 w-full max-w-6xl mx-auto px-4 py-8 space-y-10">

                {/* Welcome Header */}
                <div className="space-y-3">
                    <h1 className="text-4xl font-extrabold tracking-tight text-foreground">Welcome to your Portal</h1>
                    <p className="text-lg text-muted-foreground max-w-2xl leading-relaxed">
                        You are in control. Manage your data preferences, review your active consents, and seamlessly exercise your privacy rights from this secure dashboard.
                    </p>
                </div>

                <PortalNav />

                {/* Summary Metric Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <Card className="shadow-sm border-t-4 border-t-primary bg-card">
                        <CardHeader className="pb-2">
                            <CardDescription className="font-medium text-indigo-700 flex items-center gap-2">
                                <ShieldCheck className="w-5 h-5" /> Active Consents
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            {loadingSummary ? (
                                <Skeleton className="h-10 w-24 rounded-md" />
                            ) : (
                                <div className="text-4xl font-bold text-foreground">{summary?.total_consents || 0}</div>
                            )}
                        </CardContent>
                    </Card>

                    <Card className="shadow-sm border-t-4 border-t-blue-500 bg-card">
                        <CardHeader className="pb-2">
                            <CardDescription className="font-medium text-blue-700 flex items-center gap-2">
                                <FileText className="w-5 h-5" /> Active Privacy Requests
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            {loadingSummary ? (
                                <Skeleton className="h-10 w-24 rounded-md" />
                            ) : (
                                <div className="text-4xl font-bold text-foreground">{summary?.active_requests || 0}</div>
                            )}
                        </CardContent>
                    </Card>

                    <Card className="shadow-sm border-t-4 border-t-amber-500 bg-card">
                        <CardHeader className="pb-2">
                            <CardDescription className="font-medium text-amber-700 flex items-center gap-2">
                                <AlertTriangle className="w-5 h-5" /> Open Grievances
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            {loadingSummary ? (
                                <Skeleton className="h-10 w-24 rounded-md" />
                            ) : (
                                <div className="text-4xl font-bold text-foreground">{summary?.open_grievances || 0}</div>
                            )}
                        </CardContent>
                    </Card>
                </div>

                {/* Recent Activity */}
                <div className="bg-card p-6 rounded-2xl border shadow-sm space-y-5">
                    <h3 className="text-lg font-semibold text-foreground">Recent Activity</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {(loadingConsents || loadingRequests || loadingGrievances) ? (
                            <div className="col-span-2 text-sm text-muted-foreground animate-pulse">Loading recent activity...</div>
                        ) : (
                            <>
                                {/* Show consents */}
                                {consents && consents.length > 0 && consents.slice(0, 2).map((consent: any) => (
                                    <Card key={`consent-${consent.id}`} className="shadow-sm hover:shadow-md transition-shadow bg-muted/50 border">
                                        <CardContent className="p-4 flex items-center justify-between">
                                            <div>
                                                <p className="font-medium text-foreground">{consent.domain || "Unknown Domain"}</p>
                                                <p className="text-xs text-muted-foreground">Consent given on {new Date(consent.created_at).toLocaleDateString()}</p>
                                            </div>
                                            <ShieldCheck className="w-5 h-5 text-indigo-400" />
                                        </CardContent>
                                    </Card>
                                ))}
                                
                                {/* Show requests */}
                                {requests && requests.length > 0 && requests.slice(0, 2).map((request: any) => (
                                    <Card key={`request-${request.id}`} className="shadow-sm hover:shadow-md transition-shadow bg-muted/50 border">
                                        <CardContent className="p-4 flex items-center justify-between">
                                            <div>
                                                <p className="font-medium text-foreground">{request.type.replace('_', ' ')} Request</p>
                                                <p className="text-xs text-muted-foreground">Submitted on {new Date(request.created_at).toLocaleDateString()}</p>
                                            </div>
                                            <FileText className="w-5 h-5 text-blue-400" />
                                        </CardContent>
                                    </Card>
                                ))}
                                
                                {/* Show grievances */}
                                {grievances && grievances.length > 0 && grievances.slice(0, 2).map((grievance: any) => (
                                    <Card key={`grievance-${grievance.id}`} className="shadow-sm hover:shadow-md transition-shadow bg-muted/50 border">
                                        <CardContent className="p-4 flex items-center justify-between">
                                            <div>
                                                <p className="font-medium text-foreground">{grievance.issue_type} Grievance</p>
                                                <p className="text-xs text-muted-foreground">Filed on {new Date(grievance.created_at).toLocaleDateString()}</p>
                                            </div>
                                            <MessageSquare className="w-5 h-5 text-amber-400" />
                                        </CardContent>
                                    </Card>
                                ))}
                                
                                {/* Show empty state if no activity */}
                                {(!consents || consents.length === 0) && 
                                 (!requests || requests.length === 0) && 
                                 (!grievances || grievances.length === 0) && (
                                    <div className="col-span-2 p-8 text-center bg-muted/50 border border-dashed border-border rounded-xl text-muted-foreground">
                                        No recent activity found.
                                    </div>
                                )}
                            </>
                        )}
                    </div>
                </div>

            </main>
        </div>
    );
}
