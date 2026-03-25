import { useState } from "react";
import { format } from "date-fns";
import { Plus, Loader2, RefreshCw } from "lucide-react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";

import { useCookieScans, useStartCookieScan, useRescanCookieScan } from "~/features/cookie-scanner/api/scanner";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Badge } from "~/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "~/components/ui/table";
import { Card } from "~/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "~/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormMessage } from "~/components/ui/form";
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from "~/components/ui/tooltip";
import { CookieReportSheet } from "~/features/cookie-scanner/components/CookieReportSheet";

// ── Components ───────────────────────────────────────────────────────────────

const formSchema = z.object({
    url: z.string().url("Must be a valid URL, e.g. https://example.com"),
});

export default function CookieScannerPage() {
    const { data: scans, isLoading } = useCookieScans();
    const startScan = useStartCookieScan();
    const rescan = useRescanCookieScan();

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
                                        {scan.created_at ? format(new Date(scan.created_at), 'MMM dd, HH:mm:ss') : '—'}
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <div className="flex justify-end gap-2">
                                            {(scan.status === 'completed' || scan.status === 'failed') && (
                                                <TooltipProvider>
                                                    <Tooltip>
                                                        <TooltipTrigger asChild>
                                                            <Button
                                                                variant="ghost"
                                                                size="sm"
                                                                disabled={rescan.isPending}
                                                                onClick={() => rescan.mutate(scan.id)}
                                                            >
                                                                <RefreshCw className={`h-4 w-4 ${rescan.isPending ? 'animate-spin' : ''}`} />
                                                            </Button>
                                                        </TooltipTrigger>
                                                        <TooltipContent>Rescan this URL</TooltipContent>
                                                    </Tooltip>
                                                </TooltipProvider>
                                            )}
                                            <Button variant="outline" size="sm" onClick={() => setSelectedScanId(scan.id)}>
                                                View Report
                                            </Button>
                                        </div>
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
            <CookieReportSheet scanId={selectedScanId} onClose={() => setSelectedScanId(null)} onRescan={rescan} />
        </div>
    );
}
