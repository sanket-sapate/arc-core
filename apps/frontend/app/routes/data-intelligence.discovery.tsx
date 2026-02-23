import { useMemo } from "react";
import { NavLink } from "react-router";
import {
    Database, Play, FileSearch, ShieldAlert, CheckCircle2, Loader2,
    XCircle, Clock, AlertCircle, ArrowRight, Plus, Cpu, TrendingUp,
    BarChart2, Activity,
} from "lucide-react";

import { Button } from "~/components/ui/button";
import { Badge } from "~/components/ui/badge";
import { Skeleton } from "~/components/ui/skeleton";
import { Progress } from "~/components/ui/progress";

import { useDashboardStats } from "~/features/data-intelligence/api/dashboard";
import { useSources } from "~/features/data-intelligence/api/sources";
import { useJobs } from "~/features/data-intelligence/api/jobs";

// ── Palette ───────────────────────────────────────────────────────────────────

const LIKELIHOOD_COLORS: Record<string, string> = {
    VERY_LIKELY: "bg-red-500",
    LIKELY: "bg-orange-400",
    POSSIBLE: "bg-amber-400",
    UNLIKELY: "bg-slate-400",
    VERY_UNLIKELY: "bg-slate-300",
};

const LIKELIHOOD_LABELS: Record<string, string> = {
    VERY_LIKELY: "Very Likely",
    LIKELY: "Likely",
    POSSIBLE: "Possible",
    UNLIKELY: "Unlikely",
    VERY_UNLIKELY: "Very Unlikely",
};

const STATUS_CFG: Record<string, { icon: React.ElementType; className: string; label: string }> = {
    COMPLETED: { icon: CheckCircle2, className: "text-emerald-600", label: "Completed" },
    RUNNING: { icon: Loader2, className: "text-blue-500 animate-spin", label: "Running" },
    PENDING: { icon: Clock, className: "text-amber-500", label: "Pending" },
    FAILED: { icon: XCircle, className: "text-red-500", label: "Failed" },
};

// ── Stat Card ─────────────────────────────────────────────────────────────────

function StatCard({
    label, value, icon: Icon, sub, gradient, loading,
}: {
    label: string;
    value?: number | string;
    icon: React.ElementType;
    sub?: string;
    gradient: string;
    loading?: boolean;
}) {
    return (
        <div className={`relative overflow-hidden rounded-xl border bg-card p-5 shadow-sm`}>
            <div className={`absolute inset-0 opacity-[0.06] ${gradient}`} />
            <div className="relative flex items-start justify-between">
                <div>
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">{label}</p>
                    {loading ? (
                        <Skeleton className="mt-2 h-8 w-20" />
                    ) : (
                        <p className="mt-1 text-3xl font-bold tracking-tight">{value ?? "—"}</p>
                    )}
                    {sub && <p className="mt-1 text-xs text-muted-foreground">{sub}</p>}
                </div>
                <div className={`rounded-lg p-2.5 ${gradient} bg-opacity-15`}>
                    <Icon className="h-5 w-5 text-foreground/70" />
                </div>
            </div>
        </div>
    );
}

// ── Likelihood bar chart ──────────────────────────────────────────────────────

function LikelihoodChart({ data, total }: { data: Record<string, number>; total: number }) {
    const order = ["VERY_LIKELY", "LIKELY", "POSSIBLE", "UNLIKELY", "VERY_UNLIKELY"];
    const sorted = order.filter((k) => data[k] !== undefined);

    if (sorted.length === 0) return <p className="text-sm text-muted-foreground py-4">No findings data available.</p>;

    return (
        <div className="space-y-3">
            {sorted.map((key) => {
                const count = data[key] ?? 0;
                const pct = total > 0 ? Math.round((count / total) * 100) : 0;
                return (
                    <div key={key} className="space-y-1">
                        <div className="flex items-center justify-between text-sm">
                            <span className="font-medium">{LIKELIHOOD_LABELS[key] ?? key}</span>
                            <span className="text-muted-foreground">{count.toLocaleString()} <span className="text-xs">({pct}%)</span></span>
                        </div>
                        <div className="relative h-2 w-full overflow-hidden rounded-full bg-muted">
                            <div
                                className={`absolute left-0 top-0 h-full rounded-full transition-all duration-700 ${LIKELIHOOD_COLORS[key] ?? "bg-slate-400"}`}
                                style={{ width: `${pct}%` }}
                            />
                        </div>
                    </div>
                );
            })}
        </div>
    );
}

// ── Info-type bar chart ────────────────────────────────────────────────────────

function InfoTypeChart({ data }: { data: Record<string, number> }) {
    const sorted = Object.entries(data)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 8);

    const max = sorted[0]?.[1] ?? 1;

    if (sorted.length === 0) return <p className="text-sm text-muted-foreground py-4">No findings data available.</p>;

    return (
        <div className="space-y-2.5">
            {sorted.map(([key, count]) => (
                <div key={key} className="flex items-center gap-3">
                    <span className="w-40 truncate font-mono text-xs text-muted-foreground" title={key}>{key}</span>
                    <div className="relative flex-1 h-2 overflow-hidden rounded-full bg-muted">
                        <div
                            className="absolute left-0 top-0 h-full rounded-full bg-primary/70 transition-all duration-700"
                            style={{ width: `${Math.round((count / max) * 100)}%` }}
                        />
                    </div>
                    <span className="w-12 text-right text-xs text-muted-foreground">{count.toLocaleString()}</span>
                </div>
            ))}
        </div>
    );
}

// ── Recent Jobs mini-list ─────────────────────────────────────────────────────

function RecentJobs() {
    const { data: jobs, isLoading } = useJobs(1, 5);

    if (isLoading) return (
        <div className="space-y-2">
            {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-10 w-full" />)}
        </div>
    );

    if (!jobs?.length) return (
        <p className="py-6 text-center text-sm text-muted-foreground">No scan jobs yet.</p>
    );

    return (
        <div className="space-y-1">
            {jobs.map((job) => {
                const cfg = STATUS_CFG[job.status?.toUpperCase()] ?? { icon: AlertCircle, className: "text-muted-foreground", label: job.status };
                const Icon = cfg.icon;
                return (
                    <div key={job.id} className="flex items-center gap-3 rounded-lg px-3 py-2.5 hover:bg-muted/50 transition-colors">
                        <Icon className={`h-4 w-4 shrink-0 ${cfg.className}`} />
                        <div className="min-w-0 flex-1">
                            <p className="truncate text-sm font-medium">{job.source_name || `Job ${job.id.slice(0, 8)}…`}</p>
                            <p className="text-xs text-muted-foreground">{job.created_at ? new Date(job.created_at).toLocaleString() : "—"}</p>
                        </div>
                        {job.findings_count !== undefined && (
                            <Badge variant="outline" className="shrink-0 text-xs">{job.findings_count} findings</Badge>
                        )}
                    </div>
                );
            })}
        </div>
    );
}

// ── Quick Actions ─────────────────────────────────────────────────────────────

const QUICK_ACTIONS = [
    { label: "Register Data Source", href: "/data-intelligence/sources", icon: Plus, desc: "Connect a new database or bucket" },
    { label: "View Scan History", href: "/data-intelligence/jobs", icon: FileSearch, desc: "Browse completed & running scans" },
    { label: "Manage Profiles", href: "/data-intelligence/profiles", icon: ShieldAlert, desc: "Configure DLP rules and profiles" },
    { label: "Data Dictionary", href: "/data-intelligence/dictionary", icon: Database, desc: "Browse discovered schema entities" },
];

// ── Page ─────────────────────────────────────────────────────────────────────

export default function DiscoveryDashboardPage() {
    const { data: stats, isLoading: statsLoading } = useDashboardStats();
    const { data: sources, isLoading: sourcesLoading } = useSources();

    const findingsTotal = useMemo(() => {
        if (!stats?.findings_by_likelihood) return stats?.total_findings ?? 0;
        return Object.values(stats.findings_by_likelihood).reduce((a, b) => a + b, 0);
    }, [stats]);

    const jobsRunning = stats?.jobs_running ?? 0;
    const jobsComplete = stats?.jobs_completed ?? 0;
    const jobsFailed = stats?.jobs_failed ?? 0;
    const jobsTotal = (stats?.total_jobs ?? 0) || (jobsRunning + jobsComplete + jobsFailed);

    return (
        <div className="space-y-8">
            {/* ── Header ────────────────────────────────────────────────── */}
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold tracking-tight">Data Intelligence</h2>
                    <p className="text-sm text-muted-foreground">
                        PII scanning overview — sources, jobs, and findings at a glance.
                    </p>
                </div>
                <Button asChild>
                    <NavLink to="/data-intelligence/sources">
                        <Plus className="mr-2 h-4 w-4" />Add Source
                    </NavLink>
                </Button>
            </div>

            {/* ── KPI Cards ─────────────────────────────────────────────── */}
            <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
                <StatCard
                    label="Data Sources"
                    value={sourcesLoading ? undefined : (sources?.length ?? stats?.total_sources ?? 0)}
                    icon={Database}
                    sub="Connected repositories"
                    gradient="bg-violet-500"
                    loading={sourcesLoading && statsLoading}
                />
                <StatCard
                    label="Total Scans"
                    value={jobsTotal || undefined}
                    icon={Activity}
                    sub={`${jobsRunning} running · ${jobsFailed} failed`}
                    gradient="bg-blue-500"
                    loading={statsLoading}
                />
                <StatCard
                    label="PII Findings"
                    value={findingsTotal ? findingsTotal.toLocaleString() : undefined}
                    icon={TrendingUp}
                    sub="Across all completed jobs"
                    gradient="bg-rose-500"
                    loading={statsLoading}
                />
                <StatCard
                    label="Active Agents"
                    value={stats?.active_agents ?? undefined}
                    icon={Cpu}
                    sub="Endpoint scan agents"
                    gradient="bg-emerald-500"
                    loading={statsLoading}
                />
            </div>

            {/* ── Job Status Bar ─────────────────────────────────────────── */}
            {(jobsTotal > 0 || statsLoading) && (
                <div className="rounded-xl border bg-card p-5 shadow-sm space-y-3">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <BarChart2 className="h-4 w-4 text-muted-foreground" />
                            <h3 className="font-semibold text-sm">Scan Job Status</h3>
                        </div>
                        <span className="text-xs text-muted-foreground">{jobsTotal} total</span>
                    </div>
                    {statsLoading ? <Skeleton className="h-3 w-full" /> : (
                        <div className="space-y-2">
                            <div className="flex h-3 w-full overflow-hidden rounded-full bg-muted gap-0.5">
                                {jobsComplete > 0 && <div className="bg-emerald-500 rounded-l-full transition-all" style={{ width: `${(jobsComplete / jobsTotal) * 100}%` }} />}
                                {jobsRunning > 0 && <div className="bg-blue-500 transition-all" style={{ width: `${(jobsRunning / jobsTotal) * 100}%` }} />}
                                {jobsFailed > 0 && <div className="bg-red-500 rounded-r-full transition-all" style={{ width: `${(jobsFailed / jobsTotal) * 100}%` }} />}
                            </div>
                            <div className="flex items-center gap-4 text-xs text-muted-foreground">
                                <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-emerald-500 inline-block" />{jobsComplete} completed</span>
                                <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-blue-500 inline-block" />{jobsRunning} running</span>
                                <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-red-500 inline-block" />{jobsFailed} failed</span>
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* ── Main Grid ─────────────────────────────────────────────── */}
            <div className="grid gap-6 lg:grid-cols-3">
                {/* Likelihood distribution */}
                <div className="lg:col-span-1 rounded-xl border bg-card p-5 shadow-sm space-y-4">
                    <div className="flex items-center gap-2">
                        <ShieldAlert className="h-4 w-4 text-muted-foreground" />
                        <h3 className="font-semibold text-sm">Findings by Likelihood</h3>
                    </div>
                    {statsLoading ? (
                        <div className="space-y-3">{Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-6 w-full" />)}</div>
                    ) : (
                        <LikelihoodChart
                            data={stats?.findings_by_likelihood ?? {}}
                            total={findingsTotal}
                        />
                    )}
                </div>

                {/* Top PII types */}
                <div className="lg:col-span-2 rounded-xl border bg-card p-5 shadow-sm space-y-4">
                    <div className="flex items-center gap-2">
                        <TrendingUp className="h-4 w-4 text-muted-foreground" />
                        <h3 className="font-semibold text-sm">Top PII Types Detected</h3>
                    </div>
                    {statsLoading ? (
                        <div className="space-y-2">{Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-5 w-full" />)}</div>
                    ) : (
                        <InfoTypeChart data={stats?.findings_by_type ?? {}} />
                    )}
                </div>
            </div>

            {/* ── Recent Jobs + Quick Actions ────────────────────────────── */}
            <div className="grid gap-6 lg:grid-cols-2">
                {/* Recent scans */}
                <div className="rounded-xl border bg-card shadow-sm">
                    <div className="flex items-center justify-between px-5 py-4 border-b">
                        <div className="flex items-center gap-2">
                            <FileSearch className="h-4 w-4 text-muted-foreground" />
                            <h3 className="font-semibold text-sm">Recent Scan Jobs</h3>
                        </div>
                        <Button variant="ghost" size="sm" asChild className="text-xs text-muted-foreground">
                            <NavLink to="/data-intelligence/jobs">View all <ArrowRight className="ml-1 h-3 w-3" /></NavLink>
                        </Button>
                    </div>
                    <div className="p-3">
                        <RecentJobs />
                    </div>
                </div>

                {/* Quick actions */}
                <div className="rounded-xl border bg-card shadow-sm">
                    <div className="flex items-center gap-2 px-5 py-4 border-b">
                        <Play className="h-4 w-4 text-muted-foreground" />
                        <h3 className="font-semibold text-sm">Quick Actions</h3>
                    </div>
                    <div className="p-3 space-y-1">
                        {QUICK_ACTIONS.map((action) => {
                            const Icon = action.icon;
                            return (
                                <NavLink
                                    key={action.href}
                                    to={action.href}
                                    className="flex items-center gap-3 rounded-lg px-3 py-3 hover:bg-muted/50 transition-colors group"
                                >
                                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md border bg-background group-hover:border-primary/30 transition-colors">
                                        <Icon className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
                                    </div>
                                    <div className="min-w-0">
                                        <p className="text-sm font-medium">{action.label}</p>
                                        <p className="text-xs text-muted-foreground">{action.desc}</p>
                                    </div>
                                    <ArrowRight className="ml-auto h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                                </NavLink>
                            );
                        })}
                    </div>
                </div>
            </div>
        </div>
    );
}
