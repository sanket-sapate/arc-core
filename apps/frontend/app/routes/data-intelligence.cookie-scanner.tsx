import { useState } from "react";
import { format } from "date-fns";
import { Copy, Plus, Loader2, CheckCircle2, XCircle, Clock, AlertCircle, ShieldAlert, FileText, Activity } from "lucide-react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";

import { useCookieScans, useCookieScanDetails, useStartCookieScan } from "~/features/cookie-scanner/api/scanner";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Badge } from "~/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "~/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "~/components/ui/dialog";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "~/components/ui/sheet";
import { Form, FormControl, FormField, FormItem, FormMessage } from "~/components/ui/form";
import { ScrollArea } from "~/components/ui/scroll-area";
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from "~/components/ui/tooltip";

// ── Components ───────────────────────────────────────────────────────────────

const formSchema = z.object({
    url: z.string().url("Must be a valid URL, e.g. https://example.com"),
});

export default function CookieScannerPage() {
    const { data: scans, isLoading } = useCookieScans();
    const startScan = useStartCookieScan();

    const [openDialog, setOpenDialog] = useState(false);
    const [selectedScanId, setSelectedScanId] = useState<string | null>(null);

    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: { url: "" },
    });

    const onSubmit = (v: z.infer<typeof formSchema>) => {
        startScan.mutate(v.url, {
            onSuccess: () => {
                setOpenDialog(false);
                form.reset();
            }
        });
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold tracking-tight">Cookie Tracker</h2>
                    <p className="text-muted-foreground">Trace third-party & analytics trackers across domains.</p>
                </div>
                <Button onClick={() => setOpenDialog(true)}>
                    <Plus className="mr-2 h-4 w-4" /> New Scan
                </Button>
            </div>

            {/* Scan History Grid */}
            <Card>
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Target URL</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Time Started</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {isLoading ? (
                            <TableRow><TableCell colSpan={4} className="text-center text-muted-foreground py-8"><Loader2 className="animate-spin h-5 w-5 mx-auto" /></TableCell></TableRow>
                        ) : scans?.length === 0 ? (
                            <TableRow><TableCell colSpan={4} className="text-center text-muted-foreground py-8">No cookie scans running or completed.</TableCell></TableRow>
                        ) : (
                            scans?.map((scan) => (
                                <TableRow key={scan.id}>
                                    <TableCell className="font-medium max-w-sm truncate" title={scan.url}>{scan.url}</TableCell>
                                    <TableCell>
                                        <Badge variant={scan.status === 'completed' ? 'default' : scan.status === 'failed' ? 'destructive' : 'secondary'} className="capitalize">
                                            {scan.status === 'running' && <Loader2 className="mr-1 h-3 w-3 animate-spin" />}
                                            {scan.status}
                                        </Badge>
                                        {scan.error && <p className="text-xs text-red-500 mt-1 truncate max-w-[200px]" title={scan.error}>{scan.error}</p>}
                                    </TableCell>
                                    <TableCell className="text-muted-foreground">
                                        {format(new Date(scan.created_at), 'MMM dd, HH:mm:ss')}
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <Button variant="outline" size="sm" onClick={() => setSelectedScanId(scan.id)}>
                                            View Report
                                        </Button>
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </Card>

            {/* Start Scan Dialog */}
            <Dialog open={openDialog} onOpenChange={setOpenDialog}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Start Cookie Scan</DialogTitle>
                        <DialogDescription>
                            We will load the URL via a headless browser, simulate scrolling, and extract all trackers.
                        </DialogDescription>
                    </DialogHeader>
                    <Form {...form}>
                        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                            <FormField
                                control={form.control}
                                name="url"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormControl>
                                            <Input placeholder="https://example.com" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <DialogFooter>
                                <Button type="submit" disabled={startScan.isPending}>
                                    {startScan.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                    Initiate Scan
                                </Button>
                            </DialogFooter>
                        </form>
                    </Form>
                </DialogContent>
            </Dialog>

            {/* Results Sheet */}
            <CookieReportSheet scanId={selectedScanId} onClose={() => setSelectedScanId(null)} />
        </div>
    );
}

// ── Cookie Report Sheet ────────────────────────────────────────────────────────

const CAT_COLORS: Record<string, string> = {
    Analytics: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300",
    Marketing: "bg-rose-100 text-rose-800 dark:bg-rose-900/30 dark:text-rose-300",
    Functional: "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300",
    Necessary: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300",
};

function CookieReportSheet({ scanId, onClose }: { scanId: string | null; onClose: () => void }) {
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
                        <div className="flex items-center justify-center p-12 text-muted-foreground"><Loader2 className="h-6 w-6 animate-spin" /></div>
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
                <div className="p-4 border-t bg-muted/40 shrink-0">
                    <Button variant="outline" className="w-full" onClick={() => onClose()}>Close</Button>
                </div>
            </SheetContent>
        </Sheet>
    );
}
