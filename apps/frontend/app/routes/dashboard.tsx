import { type MetaFunction } from "react-router";
import { useVendors } from "../features/tprm/api/vendors";
import { usePrivacyRequests as useDSRs } from "../features/ops/api/dsrs";
import { useAssessments } from "../features/tprm/api/assessments";
import { useBreaches } from "../features/ops/api/breaches";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "~/components/ui/card";
import { Activity, ShieldAlert, Users, FileText, AlertTriangle } from "lucide-react";
import { Skeleton } from "~/components/ui/skeleton";
import { format } from "date-fns";

export const meta: MetaFunction = () => {
    return [
        { title: "ARC Dashboard | GRC & Privacy Platform" },
        { name: "description", content: "Executive overview of your privacy and vendor risk." },
    ];
};

export default function DashboardPage() {
    const { data: vendorsData, isLoading: isLoadingVendors } = useVendors();
    const { data: dsrsData, isLoading: isLoadingDSRs } = useDSRs();
    const { data: assessmentsData, isLoading: isLoadingAssessments } = useAssessments();
    const { data: breachesData, isLoading: isLoadingBreaches } = useBreaches();

    // Defensively coalesce all data structures to prevent runtime crashes
    const vendors = Array.isArray(vendorsData) ? vendorsData : ((vendorsData as any)?.data || []);
    const dsrs = Array.isArray(dsrsData) ? dsrsData : ((dsrsData as any)?.data || []);
    const assessments = Array.isArray(assessmentsData) ? assessmentsData : ((assessmentsData as any)?.data || []);
    const breaches = Array.isArray(breachesData) ? breachesData : ((breachesData as any)?.data || []);

    const activeVendors = vendors.filter((v: any) => v.status === "active").length;
    const pendingDSRs = dsrs.filter((d: any) => d.status === "pending" || d.status === "in_progress").length;
    const activeAssessments = assessments.filter((a: any) => a.status !== "completed" && a.status !== "archived").length;
    const openBreaches = breaches.filter((b: any) => b.status === "investigating" || b.status === "contained").length;

    const isLoading = isLoadingVendors || isLoadingDSRs || isLoadingAssessments || isLoadingBreaches;

    return (
        <div className="p-8 max-w-7xl mx-auto space-y-8 animate-in fade-in duration-500">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">Executive Dashboard</h1>
                <p className="text-muted-foreground mt-1 text-sm">
                    Platform-wide overview of your privacy operations and third-party risks.
                </p>
            </div>

            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
                <Card className="hover:shadow-md transition-shadow">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Active Vendors</CardTitle>
                        <Users className="h-4 w-4 text-primary" />
                    </CardHeader>
                    <CardContent>
                        {isLoadingVendors ? (
                            <Skeleton className="h-8 w-16" />
                        ) : (
                            <>
                                <div className="text-3xl font-bold">{activeVendors}</div>
                                <p className="text-xs text-muted-foreground mt-1">
                                    out of {vendors.length} total vendors managed
                                </p>
                            </>
                        )}
                    </CardContent>
                </Card>

                <Card className="hover:shadow-md transition-shadow">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Pending DSRs</CardTitle>
                        <FileText className="h-4 w-4 text-emerald-500" />
                    </CardHeader>
                    <CardContent>
                        {isLoadingDSRs ? (
                            <Skeleton className="h-8 w-16" />
                        ) : (
                            <>
                                <div className="text-3xl font-bold">{pendingDSRs}</div>
                                <p className="text-xs text-muted-foreground mt-1">
                                    out of {dsrs.length} lifetime privacy requests
                                </p>
                            </>
                        )}
                    </CardContent>
                </Card>

                <Card className="hover:shadow-md transition-shadow">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Active Assessments</CardTitle>
                        <Activity className="h-4 w-4 text-blue-500" />
                    </CardHeader>
                    <CardContent>
                        {isLoadingAssessments ? (
                            <Skeleton className="h-8 w-16" />
                        ) : (
                            <>
                                <div className="text-3xl font-bold">{activeAssessments}</div>
                                <p className="text-xs text-muted-foreground mt-1">
                                    requiring reviewer attention
                                </p>
                            </>
                        )}
                    </CardContent>
                </Card>

                <Card className="hover:shadow-md transition-shadow bg-linear-to-br from-card to-destructive/5 border-destructive/20 text-destructive-foreground">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium text-destructive">Active Breaches</CardTitle>
                        <ShieldAlert className="h-4 w-4 text-destructive" />
                    </CardHeader>
                    <CardContent>
                        {isLoadingBreaches ? (
                            <Skeleton className="h-8 w-16 bg-destructive/10" />
                        ) : (
                            <>
                                <div className="text-3xl font-bold text-destructive">{openBreaches}</div>
                                <p className="text-xs text-destructive/80 mt-1">
                                    incidents actively investigating
                                </p>
                            </>
                        )}
                    </CardContent>
                </Card>
            </div>

            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-7">
                <Card className="col-span-4 flex flex-col hover:shadow-md transition-shadow">
                    <CardHeader>
                        <CardTitle>Recent Attention Needed</CardTitle>
                        <CardDescription>
                            Latest incidents and privacy requests requiring immediate action.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="flex-1">
                        <div className="space-y-6">
                            {isLoading ? (
                                Array.from({ length: 4 }).map((_, i) => (
                                    <div key={i} className="flex items-center space-x-4">
                                        <Skeleton className="h-10 w-10 rounded-full" />
                                        <div className="space-y-2">
                                            <Skeleton className="h-4 w-[250px]" />
                                            <Skeleton className="h-4 w-[200px]" />
                                        </div>
                                    </div>
                                ))
                            ) : breaches.length === 0 && dsrs.filter((d: any) => d.status === "pending").length === 0 ? (
                                <div className="flex flex-col items-center justify-center h-full text-center p-8 text-muted-foreground border-2 border-dashed rounded-lg">
                                    <ShieldAlert className="h-10 w-10 mb-4 opacity-20" />
                                    <p className="font-medium text-foreground">All Clear</p>
                                    <p className="text-sm">No active incidents or pending requests require your attention right now.</p>
                                </div>
                            ) : (
                                <>
                                    {breaches.filter((b: any) => b.status === "investigating").slice(0, 3).map((breach: any) => (
                                        <div key={breach.id} className="flex items-center group">
                                            <div className="h-9 w-9 bg-destructive/10 text-destructive rounded-full flex items-center justify-center mr-4 group-hover:bg-destructive group-hover:text-destructive-foreground transition-colors">
                                                <AlertTriangle size={18} />
                                            </div>
                                            <div className="flex-1 space-y-1">
                                                <p className="text-sm font-medium leading-none">
                                                    Open Breach: {breach.title}
                                                </p>
                                                <p className="text-sm text-muted-foreground line-clamp-1">
                                                    Severity: <span className="capitalize">{breach.severity}</span> • Reported {breach.incident_date ? format(new Date(breach.incident_date), "MMM d") : "Unknown"}
                                                </p>
                                            </div>
                                        </div>
                                    ))}
                                    {dsrs.filter((d: any) => d.status === "pending").slice(0, Math.max(0, 4 - openBreaches)).map((dsr: any) => (
                                        <div key={dsr.id} className="flex items-center group">
                                            <div className="h-9 w-9 bg-primary/10 text-primary rounded-full flex items-center justify-center mr-4 group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                                                <FileText size={18} />
                                            </div>
                                            <div className="flex-1 space-y-1">
                                                <p className="text-sm font-medium leading-none">
                                                    Pending DSR: {dsr.subject_type?.replace('_', ' ') || 'User'}
                                                </p>
                                                <p className="text-sm text-muted-foreground line-clamp-1">
                                                    {dsr.requester_email || (dsr.system_entities ? 'System wide context' : 'No email provided')} • Received {format(new Date(dsr.created_at), "MMM d")}
                                                </p>
                                            </div>
                                        </div>
                                    ))}
                                </>
                            )}
                        </div>
                    </CardContent>
                </Card>

                <Card className="col-span-3 hover:shadow-md transition-shadow">
                    <CardHeader>
                        <CardTitle>System Activity</CardTitle>
                        <CardDescription>
                            A quick overview of what's happening.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        {isLoading ? (
                            <div className="space-y-4">
                                <Skeleton className="h-10 w-full" />
                                <Skeleton className="h-10 w-full" />
                            </div>
                        ) : (
                            <div className="space-y-6">
                                <div className="space-y-2">
                                    <div className="flex items-center justify-between text-sm">
                                        <span className="text-muted-foreground flex items-center gap-2"><Users size={14} /> Total Monitored Vendors</span>
                                        <span className="font-medium">{vendors.length}</span>
                                    </div>
                                    <div className="w-full bg-secondary h-2 rounded-full overflow-hidden">
                                        <div className="bg-primary h-full" style={{ width: vendors.length ? `${(activeVendors / vendors.length) * 100}%` : '0%' }} />
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <div className="flex items-center justify-between text-sm">
                                        <span className="text-muted-foreground flex items-center gap-2"><Activity size={14} /> Global Privacy Assessments</span>
                                        <span className="font-medium">{assessments.length}</span>
                                    </div>
                                    <div className="w-full bg-secondary h-2 rounded-full overflow-hidden">
                                        <div className="bg-blue-500 h-full" style={{ width: assessments.length ? `${Math.max(10, (1 - (activeAssessments / assessments.length)) * 100)}%` : '0%' }} />
                                    </div>
                                </div>

                                <div className="space-y-2 border-t pt-4">
                                    <div className="flex flex-col items-center justify-center p-4 bg-muted/50 rounded-lg border border-dashed border-muted-foreground/20">
                                        <ShieldAlert className="h-6 w-6 text-muted-foreground/50 mb-2" />
                                        <span className="text-xs font-medium text-muted-foreground uppercase tracking-widest">Platform Integrity</span>
                                        <span className="text-sm font-semibold text-emerald-600 mt-1 dark:text-emerald-400">All Systems Operational</span>
                                    </div>
                                </div>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
