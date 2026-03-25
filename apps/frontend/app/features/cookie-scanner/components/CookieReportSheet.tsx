import { CheckCircle2, XCircle, Loader2, Activity, ShieldAlert, FileText, RefreshCw } from "lucide-react";
import { useCookieScanDetails, useRescanCookieScan } from "../api/scanner";
import { Button } from "~/components/ui/button";
import { Badge } from "~/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "~/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "~/components/ui/sheet";
import { CAT_COLORS } from "../types";

export function CookieReportSheet({
    scanId,
    onClose,
    onRescan
}: {
    scanId: string | null;
    onClose: () => void;
    onRescan: ReturnType<typeof useRescanCookieScan>
}) {
    const { data, isLoading } = useCookieScanDetails(scanId);

    const { scan, cookies } = data ?? { scan: null, cookies: [] };

    return (
        <Sheet open={!!scanId} onOpenChange={(o) => !o && onClose()}>
            <SheetContent className="w-full sm:max-w-[700px] flex flex-col p-0 h-full max-h-screen">
                <SheetHeader className="p-6 border-b shrink-0">
                    <SheetTitle>Cookie Scan Report</SheetTitle>
                    <SheetDescription>
                        {scan?.url ?? "Loading target URL..."}
                    </SheetDescription>
                </SheetHeader>

                <div className="flex-1 min-h-0 overflow-y-auto p-6">
                    {isLoading ? (
                        <div className="flex items-center justify-center p-12 text-muted-foreground">
                            <Loader2 className="h-6 w-6 animate-spin" />
                        </div>
                    ) : (
                        <div className="space-y-8">
                            <div className="grid grid-cols-3 gap-4">
                                <Card>
                                    <CardHeader className="p-4 pb-2"><CardTitle className="text-xs text-muted-foreground font-medium uppercase">Cookies Found</CardTitle></CardHeader>
                                    <CardContent className="p-4 pt-0">
                                        <div className="text-2xl font-bold">{cookies.length}</div>
                                    </CardContent>
                                </Card>
                                <Card>
                                    <CardHeader className="p-4 pb-2"><CardTitle className="text-xs text-muted-foreground font-medium uppercase">Status</CardTitle></CardHeader>
                                    <CardContent className="p-4 pt-0">
                                        <div className="text-lg font-semibold capitalize flex items-center gap-2">
                                            {scan?.status === 'running' && <Loader2 className="h-4 w-4 animate-spin text-blue-500" />}
                                            {scan?.status === 'completed' && <CheckCircle2 className="h-4 w-4 text-emerald-500" />}
                                            {scan?.status === 'failed' && <XCircle className="h-4 w-4 text-rose-500" />}
                                            {scan?.status}
                                        </div>
                                    </CardContent>
                                </Card>
                                <Card>
                                    <CardHeader className="p-4 pb-2"><CardTitle className="text-xs text-muted-foreground font-medium uppercase">Duration</CardTitle></CardHeader>
                                    <CardContent className="p-4 pt-0">
                                        <div className="text-lg font-semibold">
                                            {scan?.completed_at && scan?.started_at ?
                                                `${Math.round((new Date(scan.completed_at).getTime() - new Date(scan.started_at).getTime()) / 1000)}s` :
                                                "—"
                                            }
                                        </div>
                                    </CardContent>
                                </Card>
                            </div>

                            {cookies.length > 0 && (
                                <div className="space-y-4">
                                    <h3 className="font-semibold px-1">Detected Trackers</h3>
                                    <div className="rounded-md border">
                                        <Table>
                                            <TableHeader>
                                                <TableRow>
                                                    <TableHead className="w-[180px]">Category & Name</TableHead>
                                                    <TableHead>Domain & Details</TableHead>
                                                </TableRow>
                                            </TableHeader>
                                            <TableBody>
                                                {cookies.map(c => (
                                                    <TableRow key={c.id}>
                                                        <TableCell className="align-top">
                                                            <div className="space-y-1.5">
                                                                <Badge variant="secondary" className={`${CAT_COLORS[c.category] ?? 'bg-slate-100'} border-transparent text-[10px]`}>
                                                                    {c.category}
                                                                </Badge>
                                                                <p className="font-mono text-sm max-w-[170px] truncate" title={c.name}>{c.name}</p>
                                                            </div>
                                                        </TableCell>
                                                        <TableCell className="align-top py-4">
                                                            <div className="space-y-2">
                                                                <div>
                                                                    <p className="text-sm font-medium">{c.domain || 'N/A'}</p>
                                                                    <p className="text-xs text-muted-foreground font-mono truncate max-w-xs">{c.path}</p>
                                                                </div>
                                                                <div className="flex gap-2 text-[10px] text-muted-foreground uppercase font-medium">
                                                                    {c.secure && <span className="flex items-center gap-1"><ShieldAlert className="h-3 w-3" /> Secure</span>}
                                                                    {c.http_only && <span className="flex items-center gap-1"><FileText className="h-3 w-3" /> HttpOnly</span>}
                                                                    {c.same_site && <span className="flex items-center gap-1 border rounded px-1">{c.same_site}</span>}
                                                                </div>
                                                                <p className="text-xs text-muted-foreground line-clamp-1">{c.description}</p>
                                                            </div>
                                                        </TableCell>
                                                    </TableRow>
                                                ))}
                                            </TableBody>
                                        </Table>
                                    </div>
                                </div>
                            )}

                            {scan?.status === 'running' && (
                                <div className="text-center p-8 space-y-4">
                                    <Activity className="h-8 w-8 animate-pulse text-muted-foreground mx-auto" />
                                    <p className="text-sm text-muted-foreground">Chrome headless engine is navigating... please wait.</p>
                                </div>
                            )}
                        </div>
                    )}
                </div>
                <div className="p-4 border-t bg-muted/40 shrink-0 flex gap-2">
                    {scanId && (scan?.status === 'completed' || scan?.status === 'failed') && (
                        <Button
                            variant="default"
                            className="flex-1"
                            disabled={onRescan.isPending}
                            onClick={() => {
                                onRescan.mutate(scanId);
                                onClose();
                            }}
                        >
                            <RefreshCw className={`mr-2 h-4 w-4 ${onRescan.isPending ? 'animate-spin' : ''}`} />
                            Rescan
                        </Button>
                    )}
                    <Button variant="outline" className="flex-1" onClick={() => onClose()}>Close</Button>
                </div>
            </SheetContent>
        </Sheet>
    );
}
