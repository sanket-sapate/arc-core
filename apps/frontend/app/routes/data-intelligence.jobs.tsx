import { useState } from "react";
import {
    ChevronRight, Search, Loader2, CheckCircle2, Clock, XCircle, AlertCircle,
    Filter, RefreshCw, Trash2, ChevronLeft,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "~/components/ui/button";
import { Badge } from "~/components/ui/badge";
import { Skeleton } from "~/components/ui/skeleton";
import { Input } from "~/components/ui/input";
import {
    Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "~/components/ui/table";
import {
    Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle,
} from "~/components/ui/sheet";
import {
    AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
    AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "~/components/ui/alert-dialog";

import { useJobs, useJobFindings, useDeleteJob, useRefineJob, type Job, type Finding, type FindingsFilters } from "~/features/data-intelligence/api/jobs";

// ── Status config ─────────────────────────────────────────────────────────────

const STATUS_CFG: Record<string, { label: string; icon: React.ElementType; className: string }> = {
    COMPLETED: { label: "Completed", icon: CheckCircle2, className: "bg-emerald-500/15 text-emerald-700 border-emerald-500/25" },
    PENDING: { label: "Pending", icon: Clock, className: "bg-amber-500/15 text-amber-700 border-amber-500/25" },
    RUNNING: { label: "Running", icon: Loader2, className: "bg-blue-500/15 text-blue-700 border-blue-500/25" },
    FAILED: { label: "Failed", icon: XCircle, className: "bg-red-500/15 text-red-700 border-red-500/25" },
};

const LIKELIHOOD_CFG: Record<string, string> = {
    VERY_LIKELY: "bg-red-500/15 text-red-700 border-red-500/25",
    LIKELY: "bg-orange-500/15 text-orange-700 border-orange-500/25",
    POSSIBLE: "bg-amber-500/15 text-amber-700 border-amber-500/25",
    UNLIKELY: "bg-slate-500/15 text-slate-600 border-slate-500/25",
    VERY_UNLIKELY: "bg-slate-500/10 text-slate-500 border-slate-500/15",
};

function StatusBadge({ status }: { status: string }) {
    const cfg = STATUS_CFG[status?.toUpperCase()] ?? { label: status, icon: AlertCircle, className: "bg-muted text-muted-foreground" };
    const Icon = cfg.icon;
    return (
        <Badge variant="outline" className={`flex w-fit items-center gap-1 ${cfg.className}`}>
            <Icon className="h-3 w-3" />
            {cfg.label}
        </Badge>
    );
}

// ── Findings Panel ─────────────────────────────────────────────────────────

function FindingsPanel({ job, open, onClose }: { job: Job | null; open: boolean; onClose: () => void }) {
    const [page, setPage] = useState(1);
    const [filters, setFilters] = useState<FindingsFilters>({});
    const [filterInput, setFilterInput] = useState("");

    const { data: resp, isLoading, isFetching } = useJobFindings(open && job ? job.id : null, page, 50, filters);
    const { mutate: refineJob, isPending: isRefining } = useRefineJob();

    const applyFilter = () => {
        const trimmed = filterInput.trim();
        setFilters(trimmed ? { table: trimmed } : {});
        setPage(1);
    };

    const findings = resp?.findings ?? [];
    const totalPages = resp?.total_pages ?? 0;

    return (
        <Sheet open={open} onOpenChange={(v) => !v && onClose()}>
            <SheetContent className="sm:max-w-3xl overflow-y-auto">
                <SheetHeader>
                    <SheetTitle>Job Findings</SheetTitle>
                    <SheetDescription>
                        Discovered PII for job <code className="bg-muted rounded px-1 text-xs">{job?.id?.slice(0, 8)}…</code>
                        {resp && <span className="ml-2 text-muted-foreground">({resp.count} total)</span>}
                    </SheetDescription>
                </SheetHeader>

                {/* Actions bar */}
                <div className="mt-4 flex items-center gap-2">
                    <Input
                        className="h-8 flex-1 text-sm"
                        placeholder="Filter by table / path…"
                        value={filterInput}
                        onChange={(e) => setFilterInput(e.target.value)}
                        onKeyDown={(e) => e.key === "Enter" && applyFilter()}
                    />
                    <Button variant="outline" size="sm" onClick={applyFilter}><Filter className="h-3.5 w-3.5" /></Button>
                    <Button
                        variant="outline"
                        size="sm"
                        disabled={isRefining}
                        onClick={() => job && refineJob(job.id, {
                            onSuccess: () => toast.success("Refine job queued"),
                            onError: () => toast.error("Failed to queue refine"),
                        })}
                    >
                        <RefreshCw className="mr-1 h-3.5 w-3.5" />{isRefining ? "Refining…" : "Refine"}
                    </Button>
                </div>

                <div className="mt-4">
                    {(isLoading || isFetching) && (
                        <div className="space-y-3">{Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-10 w-full" />)}</div>
                    )}

                    {!isLoading && findings.length === 0 && (
                        <div className="flex flex-col items-center py-16 text-muted-foreground gap-3">
                            <Search className="h-10 w-10 opacity-30" />
                            <p>No findings for this job.</p>
                        </div>
                    )}

                    {findings.length > 0 && (
                        <>
                            <div className="rounded-lg border">
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Info Type</TableHead>
                                            <TableHead>Likelihood</TableHead>
                                            <TableHead>Location</TableHead>
                                            <TableHead className="text-right">Confidence</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {findings.map((f: Finding, idx: number) => {
                                            const lhKey = f.likelihood?.toUpperCase() ?? "";
                                            const lhClass = LIKELIHOOD_CFG[lhKey] ?? "bg-muted text-muted-foreground";
                                            return (
                                                <TableRow key={idx}>
                                                    <TableCell className="font-mono text-sm font-medium">{f.info_type}</TableCell>
                                                    <TableCell>
                                                        {f.likelihood ? (
                                                            <Badge variant="outline" className={lhClass}>{f.likelihood}</Badge>
                                                        ) : <span className="text-muted-foreground">—</span>}
                                                    </TableCell>
                                                    <TableCell className="max-w-[200px] truncate text-sm text-muted-foreground">{f.location}</TableCell>
                                                    <TableCell className="text-right text-sm text-muted-foreground">
                                                        {f.confidence !== undefined ? `${Math.round(f.confidence * 100)}%` : "—"}
                                                    </TableCell>
                                                </TableRow>
                                            );
                                        })}
                                    </TableBody>
                                </Table>
                            </div>

                            {/* Pagination */}
                            {totalPages > 1 && (
                                <div className="mt-4 flex items-center justify-between text-sm text-muted-foreground">
                                    <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
                                        <ChevronLeft className="h-4 w-4" />
                                    </Button>
                                    <span>Page {page} of {totalPages}</span>
                                    <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)}>
                                        <ChevronRight className="h-4 w-4" />
                                    </Button>
                                </div>
                            )}
                        </>
                    )}
                </div>
            </SheetContent>
        </Sheet>
    );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function JobsPage() {
    const [selectedJob, setSelectedJob] = useState<Job | null>(null);
    const [deleteTarget, setDeleteTarget] = useState<Job | null>(null);
    const [page, setPage] = useState(1);

    const { data: jobs, isLoading, isError } = useJobs(page, 25);
    const { mutate: deleteJob, isPending: isDeleting } = useDeleteJob();

    const handleDelete = () => {
        if (!deleteTarget) return;
        deleteJob(deleteTarget.id, {
            onSuccess: () => { toast.success("Job deleted."); setDeleteTarget(null); },
            onError: () => toast.error("Failed to delete job."),
        });
    };

    return (
        <div className="space-y-6">
            <div>
                <h2 className="text-2xl font-bold tracking-tight">Scan History</h2>
                <p className="text-sm text-muted-foreground">View scan jobs and explore PII findings per job.</p>
            </div>

            {isLoading && <div className="space-y-3">{Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-12 w-full rounded-md" />)}</div>}
            {isError && <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-4 text-sm text-destructive">Failed to load scan jobs.</div>}

            {jobs && (
                <div className="rounded-lg border">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Job ID</TableHead>
                                <TableHead>Source</TableHead>
                                <TableHead>Type</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead>Findings</TableHead>
                                <TableHead className="text-right">Started</TableHead>
                                <TableHead className="w-16" />
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {jobs.length === 0 ? (
                                <TableRow><TableCell colSpan={7} className="h-32 text-center text-muted-foreground">No scan jobs yet. Trigger a scan from the Data Sources page.</TableCell></TableRow>
                            ) : (
                                jobs.map((job) => (
                                    <TableRow key={job.id} className="cursor-pointer hover:bg-muted/40" onClick={() => setSelectedJob(job)}>
                                        <TableCell className="font-mono text-xs text-muted-foreground">{job.id.slice(0, 8)}…</TableCell>
                                        <TableCell className="font-medium">{job.source_name || job.source_id?.slice(0, 8) || "—"}</TableCell>
                                        <TableCell>{job.type ? <Badge variant="outline" className="capitalize">{job.type}</Badge> : <span className="text-muted-foreground">—</span>}</TableCell>
                                        <TableCell><StatusBadge status={job.status} /></TableCell>
                                        <TableCell className="text-sm">{job.findings_count !== undefined ? <span className="font-semibold">{job.findings_count}</span> : "—"}</TableCell>
                                        <TableCell className="text-right text-sm text-muted-foreground">{job.created_at ? new Date(job.created_at).toLocaleString() : "—"}</TableCell>
                                        <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
                                            <div className="flex items-center justify-end gap-1">
                                                <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-destructive" onClick={() => setDeleteTarget(job)}>
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                                <Button variant="ghost" size="icon" className="h-8 w-8">
                                                    <ChevronRight className="h-4 w-4 text-muted-foreground" />
                                                </Button>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </div>
            )}

            {/* Findings Panel */}
            <FindingsPanel job={selectedJob} open={!!selectedJob} onClose={() => setSelectedJob(null)} />

            {/* Delete confirm */}
            <AlertDialog open={!!deleteTarget} onOpenChange={(v) => !v && setDeleteTarget(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Delete job {deleteTarget?.id.slice(0, 8)}…?</AlertDialogTitle>
                        <AlertDialogDescription>This permanently removes the job and its findings from the scanner.</AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={handleDelete} disabled={isDeleting} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                            {isDeleting ? "Deleting…" : "Delete"}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}
