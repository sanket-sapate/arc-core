import { useState, useMemo } from "react";
import {
    CheckCircle, XCircle, AlertCircle, Search, Database, RefreshCw,
    Loader2, Filter,
} from "lucide-react";
import { toast } from "sonner";

import { Button } from "~/components/ui/button";
import { Badge } from "~/components/ui/badge";
import { Input } from "~/components/ui/input";
import { Skeleton } from "~/components/ui/skeleton";
import {
    Card, CardContent, CardDescription, CardHeader, CardTitle,
} from "~/components/ui/card";
import {
    Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "~/components/ui/table";
import {
    Tabs, TabsList, TabsTrigger,
} from "~/components/ui/tabs";
import {
    AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
    AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "~/components/ui/alert-dialog";

import {
    useFindings, useApproveFinding, useRejectFinding,
    enrichFindings, type ScanFinding, type MappedFinding,
} from "~/features/data-intelligence/api/mapping";
import { useDictionaryItems, useCreateDictionaryItem } from "~/features/data-intelligence/api/dictionary";

// ── Helpers ──────────────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: string }) {
    switch (status) {
        case "matched":
            return (
                <Badge variant="outline" className="bg-emerald-500/10 text-emerald-600 border-emerald-500/20 gap-1">
                    <CheckCircle className="h-3 w-3" />Matched
                </Badge>
            );
        case "unmatched":
            return (
                <Badge variant="outline" className="bg-amber-500/10 text-amber-600 border-amber-500/20 gap-1">
                    <AlertCircle className="h-3 w-3" />Unmatched
                </Badge>
            );
        case "ignored":
            return (
                <Badge variant="secondary" className="gap-1">
                    <XCircle className="h-3 w-3" />Ignored
                </Badge>
            );
        default:
            return <Badge variant="secondary">{status}</Badge>;
    }
}

function ConfidenceBar({ value }: { value: number }) {
    const pct = Math.round((value > 1 ? value : value * 100));
    return (
        <div className="flex items-center gap-2">
            <div className="w-16 h-2 bg-secondary rounded-full overflow-hidden">
                <div className="h-full bg-primary rounded-full" style={{ width: `${pct}%` }} />
            </div>
            <span className="text-xs text-muted-foreground">{pct}%</span>
        </div>
    );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function MappingPage() {
    const [searchQuery, setSearchQuery] = useState("");
    const [activeTab, setActiveTab] = useState("all");
    const [confirmDialog, setConfirmDialog] = useState<{
        open: boolean;
        type: "approve" | "reject";
        finding: MappedFinding | null;
    }>({ open: false, type: "approve", finding: null });

    // Data fetching
    const { data: rawFindings, isLoading: findingsLoading, refetch: refetchFindings } = useFindings();
    const { data: dictItems, isLoading: dictLoading } = useDictionaryItems();
    const { mutate: approveFinding, isPending: approving } = useApproveFinding();
    const { mutate: rejectFinding, isPending: rejecting } = useRejectFinding();
    const { mutate: createDictItem } = useCreateDictionaryItem();

    const isLoading = findingsLoading || dictLoading;
    const processing = approving || rejecting;

    // Enrich findings with mapping state
    const { mapped, summary, unusedDictEntries } = useMemo(() => {
        if (!rawFindings || !dictItems) {
            return {
                mapped: [] as MappedFinding[],
                summary: { total_findings: 0, matched: 0, unmatched: 0, ignored: 0, unused_dict_count: 0 },
                unusedDictEntries: [] as typeof dictItems,
            };
        }
        return enrichFindings(rawFindings, dictItems as any);
    }, [rawFindings, dictItems]);

    // Filtering
    const filteredFindings = useMemo(() => {
        return mapped.filter((f) => {
            const matchesSearch =
                f.info_type.toLowerCase().includes(searchQuery.toLowerCase()) ||
                (f.location || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
                (f.table || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
                (f.column || "").toLowerCase().includes(searchQuery.toLowerCase());
            const matchesTab = activeTab === "all" || f.match_status === activeTab;
            return matchesSearch && matchesTab;
        });
    }, [mapped, searchQuery, activeTab]);

    // Actions
    const handleApprove = (finding: MappedFinding) => {
        setConfirmDialog({ open: false, type: "approve", finding: null });

        // Add to dictionary with the info_type as name
        const entryName = finding.info_type.replace(/_/g, " ");
        createDictItem(
            { name: entryName, category: "PII", sensitivity: "high", active: true },
            {
                onSuccess: () => {
                    approveFinding(
                        { finding, dictEntryName: entryName },
                        {
                            onSuccess: () => {
                                toast.success(`"${entryName}" approved and added to Data Dictionary`);
                                refetchFindings();
                            },
                        },
                    );
                },
                onError: () => {
                    // Entry might already exist, still approve
                    approveFinding(
                        { finding, dictEntryName: entryName },
                        {
                            onSuccess: () => {
                                toast.success(`"${entryName}" approved`);
                                refetchFindings();
                            },
                        },
                    );
                },
            },
        );
    };

    const handleReject = (finding: MappedFinding) => {
        setConfirmDialog({ open: false, type: "reject", finding: null });
        rejectFinding(finding, {
            onSuccess: () => {
                toast.success(`"${finding.info_type}" marked as ignored`);
                refetchFindings();
            },
        });
    };

    const handleConfirmAction = () => {
        if (!confirmDialog.finding) return;
        if (confirmDialog.type === "approve") {
            handleApprove(confirmDialog.finding);
        } else {
            handleReject(confirmDialog.finding);
        }
    };

    if (isLoading) {
        return (
            <div className="space-y-6">
                <div className="flex items-center gap-3">
                    <Loader2 className="h-5 w-5 animate-spin text-primary" />
                    <span className="text-muted-foreground">Loading mapping data…</span>
                </div>
                <div className="grid grid-cols-4 gap-4">
                    {[1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-24 rounded-lg" />)}
                </div>
                <Skeleton className="h-96 rounded-lg" />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold tracking-tight">Personal Data Classification Review</h2>
                    <p className="text-sm text-muted-foreground">
                        Review and classify discovered personal data fields against the Data Dictionary.
                    </p>
                </div>
                <Button variant="outline" onClick={() => refetchFindings()} className="gap-2">
                    <RefreshCw className="h-4 w-4" />
                    Refresh
                </Button>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">Total Findings</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-bold">{summary.total_findings}</div>
                    </CardContent>
                </Card>
                <Card className="border-emerald-500/20">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-emerald-600">Matched</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-bold text-emerald-600">{summary.matched}</div>
                        <p className="text-xs text-muted-foreground mt-1">In Data Dictionary</p>
                    </CardContent>
                </Card>
                <Card className="border-amber-500/20">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-amber-600">Unmatched</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-bold text-amber-600">{summary.unmatched}</div>
                        <p className="text-xs text-muted-foreground mt-1">Needs Approval</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">Unused Dictionary</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-bold text-muted-foreground">{summary.unused_dict_count}</div>
                        <p className="text-xs text-muted-foreground mt-1">No matching findings</p>
                    </CardContent>
                </Card>
            </div>

            {/* Tabs and Search */}
            <div className="flex items-center justify-between gap-4">
                <Tabs value={activeTab} onValueChange={setActiveTab}>
                    <TabsList>
                        <TabsTrigger value="all">All ({mapped.length})</TabsTrigger>
                        <TabsTrigger value="matched">Matched ({summary.matched})</TabsTrigger>
                        <TabsTrigger value="unmatched">Unmatched ({summary.unmatched})</TabsTrigger>
                        <TabsTrigger value="ignored">Ignored ({summary.ignored})</TabsTrigger>
                    </TabsList>
                </Tabs>
                <div className="relative w-64">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Search findings…"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-9"
                    />
                </div>
            </div>

            {/* Findings Table */}
            <Card>
                <CardHeader>
                    <CardTitle>Personal Data Findings</CardTitle>
                    <CardDescription>Discovered personal data fields mapped against Data Dictionary</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="rounded-lg border">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Status</TableHead>
                                    <TableHead>Data Category</TableHead>
                                    <TableHead>Location</TableHead>
                                    <TableHead>Resource</TableHead>
                                    <TableHead>Confidence</TableHead>
                                    <TableHead>Dict Entry</TableHead>
                                    <TableHead className="text-right">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {filteredFindings.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={7} className="h-32 text-center text-muted-foreground">
                                            {rawFindings && rawFindings.length === 0
                                                ? "No findings discovered yet. Run a scan to see results."
                                                : "No findings match the current filters."}
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    filteredFindings.map((finding, idx) => (
                                        <TableRow key={finding.id || `${finding.info_type}-${idx}`}>
                                            <TableCell>
                                                <StatusBadge status={finding.match_status} />
                                            </TableCell>
                                            <TableCell>
                                                <span className="font-medium">{finding.info_type.replace(/_/g, " ")}</span>
                                            </TableCell>
                                            <TableCell>
                                                <code className="text-xs bg-muted px-2 py-1 rounded text-primary">
                                                    {finding.table
                                                        ? `${finding.table}${finding.column ? `.${finding.column}` : ""}`
                                                        : finding.location || finding.path || "—"}
                                                </code>
                                            </TableCell>
                                            <TableCell className="text-muted-foreground text-sm">
                                                {finding.table || finding.path || "—"}
                                            </TableCell>
                                            <TableCell>
                                                <ConfidenceBar value={finding.confidence ?? 0} />
                                            </TableCell>
                                            <TableCell>
                                                {finding.dict_entry_name ? (
                                                    <Badge variant="outline" className="text-emerald-600 border-emerald-500/30 gap-1">
                                                        <Database className="h-3 w-3" />
                                                        {finding.dict_entry_name}
                                                    </Badge>
                                                ) : (
                                                    <span className="text-muted-foreground">—</span>
                                                )}
                                            </TableCell>
                                            <TableCell className="text-right">
                                                {finding.match_status === "unmatched" && (
                                                    <div className="flex items-center justify-end gap-2">
                                                        <Button
                                                            size="sm"
                                                            variant="outline"
                                                            onClick={() => setConfirmDialog({ open: true, type: "approve", finding })}
                                                            disabled={processing}
                                                            className="text-emerald-600 border-emerald-500/30 hover:bg-emerald-500/10 gap-1"
                                                        >
                                                            <CheckCircle className="h-4 w-4" />
                                                            Approve
                                                        </Button>
                                                        <Button
                                                            size="sm"
                                                            variant="outline"
                                                            onClick={() => setConfirmDialog({ open: true, type: "reject", finding })}
                                                            disabled={processing}
                                                            className="text-destructive border-destructive/30 hover:bg-destructive/10 gap-1"
                                                        >
                                                            <XCircle className="h-4 w-4" />
                                                            Reject
                                                        </Button>
                                                    </div>
                                                )}
                                                {finding.match_status === "matched" && (
                                                    <Badge variant="outline" className="text-emerald-600 border-emerald-500/30 gap-1">
                                                        <CheckCircle className="h-3 w-3" />Verified
                                                    </Badge>
                                                )}
                                                {finding.match_status === "ignored" && (
                                                    <Badge variant="secondary" className="gap-1">
                                                        <XCircle className="h-3 w-3" />Ignored
                                                    </Badge>
                                                )}
                                            </TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    </div>
                </CardContent>
            </Card>

            {/* Unused Dictionary Entries */}
            {unusedDictEntries && unusedDictEntries.length > 0 && (
                <Card>
                    <CardHeader>
                        <CardTitle className="text-lg flex items-center gap-2">
                            <Database className="h-5 w-5" />
                            Dictionary Entries with No Findings
                        </CardTitle>
                        <CardDescription>
                            These data dictionary entries have no matching PII discoveries in any scan
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="flex flex-wrap gap-2">
                            {unusedDictEntries.map((entry: any) => (
                                <Badge key={entry.id} variant="secondary" className="text-sm py-1.5 px-3">
                                    {entry.name}
                                    <span className="ml-2 text-xs opacity-70">({entry.category})</span>
                                </Badge>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Confirmation Dialog */}
            <AlertDialog
                open={confirmDialog.open}
                onOpenChange={(open) => setConfirmDialog((prev) => ({ ...prev, open }))}
            >
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>
                            {confirmDialog.type === "approve" ? "Approve Finding" : "Reject Finding"}
                        </AlertDialogTitle>
                        <AlertDialogDescription>
                            {confirmDialog.type === "approve"
                                ? `Are you sure you want to approve "${confirmDialog.finding?.info_type?.replace(/_/g, " ")}"? This will add it to the Data Dictionary.`
                                : `Are you sure you want to reject "${confirmDialog.finding?.info_type?.replace(/_/g, " ")}"? This will mark it as ignored.`}
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={handleConfirmAction}
                            className={confirmDialog.type === "approve"
                                ? "bg-emerald-600 text-white hover:bg-emerald-700"
                                : "bg-destructive text-destructive-foreground hover:bg-destructive/90"}
                        >
                            {confirmDialog.type === "approve" ? "Yes, Approve" : "Yes, Reject"}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}
