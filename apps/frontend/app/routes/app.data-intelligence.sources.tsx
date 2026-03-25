import { useState, useEffect } from "react";
import { Plus, Database, Cloud, Server, HardDrive, Play, Pencil, Trash2, Calendar, Clock, Loader2, CheckCircle, XCircle, Shield } from "lucide-react";
import { toast } from "sonner";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

import { Button } from "~/components/ui/button";
import { Badge } from "~/components/ui/badge";
import { Skeleton } from "~/components/ui/skeleton";
import { Switch } from "~/components/ui/switch";
import { Label } from "~/components/ui/label";
import {
    Card, CardContent, CardHeader, CardTitle,
} from "~/components/ui/card";
import {
    Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger,
} from "~/components/ui/sheet";
import {
    Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter,
} from "~/components/ui/dialog";
import {
    Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "~/components/ui/table";
import {
    Form, FormControl, FormField, FormItem, FormLabel, FormMessage,
} from "~/components/ui/form";
import { Input } from "~/components/ui/input";
import {
    Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "~/components/ui/select";
import {
    AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
    AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "~/components/ui/alert-dialog";

import { useSources, useRegisterSource, useDeleteSource, type SourceType, type Source } from "~/features/data-intelligence/api/sources";
import { useProfiles } from "~/features/data-intelligence/api/profiles";
import { useTriggerScan, useJobs } from "~/features/data-intelligence/api/jobs";
import { useSchedules, useCreateSchedule, useDeleteSchedule } from "~/features/data-intelligence/api/schedules";
import { api } from "~/lib/api";

// ── Constants ─────────────────────────────────────────────────────────────────

const SOURCE_TYPES: { value: SourceType; label: string; icon: React.ElementType }[] = [
    { value: "postgres", label: "PostgreSQL", icon: Database },
    { value: "mysql", label: "MySQL", icon: Database },
    { value: "mssql", label: "SQL Server", icon: Database },
    { value: "s3", label: "Amazon S3", icon: Cloud },
    { value: "agent_linux", label: "Linux Agent", icon: Server },
    { value: "agent_windows", label: "Windows Agent", icon: HardDrive },
];

const DB_TYPES: SourceType[] = ["postgres", "mysql", "mssql"];
const S3_TYPES: SourceType[] = ["s3"];
const AGENT_TYPES: SourceType[] = ["agent_linux", "agent_windows"];

const DEFAULT_PORTS: Record<string, string> = {
    postgres: "5432",
    mysql: "3306",
    mssql: "1433",
};

const DB_DESCRIPTIONS: Record<string, string> = {
    postgres: "Connect to a PostgreSQL database to scan tables and columns for PII.",
    mysql: "Connect to a MySQL database to discover sensitive data across schemas.",
    mssql: "Connect to a Microsoft SQL Server instance for data classification.",
};

const formSchema = z.object({
    name: z.string().min(1, "Name is required"),
    type: z.string().min(1, "Type is required"),
    host: z.string().optional(),
    port: z.string().optional(),
    database: z.string().optional(),
    username: z.string().optional(),
    password: z.string().optional(),
    ssl_mode: z.boolean().optional(),
    bucket: z.string().optional(),
    region: z.string().optional(),
    access_key: z.string().optional(),
    secret_key: z.string().optional(),
    agent_id: z.string().optional(),
    api_key: z.string().optional(),
    worker_group: z.string().optional(),
});
type FormValues = z.infer<typeof formSchema>;

const typeIconEl = (type: string) => {
    const found = SOURCE_TYPES.find((t) => t.value === type);
    if (!found) return <Server className="h-4 w-4 text-muted-foreground" />;
    const Icon = found.icon;
    return <Icon className="h-4 w-4 text-muted-foreground" />;
};

// ── Register Source Form ────────────────────────────────────────────────────

function RegisterSourceForm({ onSuccess }: { onSuccess: () => void }) {
    const { mutate, isPending } = useRegisterSource();
    const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);
    const [testing, setTesting] = useState(false);
    const form = useForm<FormValues>({
        resolver: zodResolver(formSchema),
        defaultValues: { name: "", type: "", host: "", port: "", database: "", username: "", password: "", ssl_mode: false, bucket: "", region: "", access_key: "", secret_key: "", agent_id: "", api_key: "", worker_group: "" },
    });
    const watchedType = form.watch("type") as SourceType;
    const isDB = DB_TYPES.includes(watchedType);
    const isS3 = S3_TYPES.includes(watchedType);
    const isAgent = AGENT_TYPES.includes(watchedType);

    // Auto-populate port when DB type changes
    useEffect(() => {
        if (isDB && DEFAULT_PORTS[watchedType]) {
            const currentPort = form.getValues("port");
            if (!currentPort || Object.values(DEFAULT_PORTS).includes(currentPort)) {
                form.setValue("port", DEFAULT_PORTS[watchedType]);
            }
        }
        setTestResult(null);
    }, [watchedType]);

    const onSubmit = (values: FormValues) => {
        const configuration: Record<string, unknown> = {};
        if (isDB) {
            if (values.host) configuration.host = values.host;
            if (values.port) configuration.port = parseInt(values.port, 10);
            if (values.database) configuration.database = values.database;
            if (values.username) configuration.username = values.username;
            if (values.password) configuration.password = values.password;
            if (values.ssl_mode) configuration.ssl_mode = "require";
        }
        if (isS3) {
            if (values.bucket) configuration.bucket = values.bucket;
            if (values.region) configuration.region = values.region;
            if (values.access_key) configuration.access_key = values.access_key;
            if (values.secret_key) configuration.secret_key = values.secret_key;
        }
        if (isAgent) {
            if (values.agent_id) configuration.agent_id = values.agent_id;
            if (values.api_key) configuration.api_key = values.api_key;
        }

        mutate(
            { name: values.name, type: values.type as SourceType, configuration, worker_group: values.worker_group || undefined },
            {
                onSuccess: () => { toast.success("Data source registered."); form.reset(); onSuccess(); },
                onError: (err: any) => toast.error(err?.response?.data?.error || err.message || "Failed to register source."),
            }
        );
    };

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 mt-6">
                <FormField control={form.control} name="name" render={({ field }) => (
                    <FormItem><FormLabel>Source Name</FormLabel><FormControl><Input placeholder="e.g. Production DB" {...field} /></FormControl><FormMessage /></FormItem>
                )} />
                <FormField control={form.control} name="type" render={({ field }) => (
                    <FormItem>
                        <FormLabel>Source Type</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl><SelectTrigger><SelectValue placeholder="Select a type" /></SelectTrigger></FormControl>
                            <SelectContent>
                                {SOURCE_TYPES.map((t) => (
                                    <SelectItem key={t.value} value={t.value}>
                                        <span className="flex items-center gap-2"><t.icon className="h-4 w-4" />{t.label}</span>
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        <FormMessage />
                    </FormItem>
                )} />

                {/* DB type helper */}
                {isDB && DB_DESCRIPTIONS[watchedType] && (
                    <p className="text-xs text-muted-foreground bg-muted/40 rounded-md px-3 py-2">{DB_DESCRIPTIONS[watchedType]}</p>
                )}

                {isDB && (
                    <div className="space-y-4 rounded-lg border p-4 bg-muted/20">
                        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Connection Details</p>
                        <div className="grid grid-cols-3 gap-3">
                            <div className="col-span-2">
                                <FormField control={form.control} name="host" render={({ field }) => (
                                    <FormItem><FormLabel>Host</FormLabel><FormControl><Input placeholder="db.example.com" {...field} /></FormControl><FormMessage /></FormItem>
                                )} />
                            </div>
                            <FormField control={form.control} name="port" render={({ field }) => (
                                <FormItem><FormLabel>Port</FormLabel><FormControl><Input placeholder={DEFAULT_PORTS[watchedType] || "5432"} {...field} /></FormControl><FormMessage /></FormItem>
                            )} />
                        </div>
                        <FormField control={form.control} name="database" render={({ field }) => (
                            <FormItem><FormLabel>Database</FormLabel><FormControl><Input placeholder="my_database" {...field} /></FormControl><FormMessage /></FormItem>
                        )} />
                        <FormField control={form.control} name="username" render={({ field }) => (
                            <FormItem><FormLabel>Username</FormLabel><FormControl><Input placeholder="readonly_user" {...field} /></FormControl><FormMessage /></FormItem>
                        )} />
                        <FormField control={form.control} name="password" render={({ field }) => (
                            <FormItem><FormLabel>Password</FormLabel><FormControl><Input type="password" placeholder="••••••••" {...field} /></FormControl><FormMessage /></FormItem>
                        )} />
                        {/* SSL Toggle */}
                        <div className="flex items-center justify-between rounded-md border p-3 bg-background">
                            <div className="flex items-center gap-2">
                                <Shield className="h-4 w-4 text-muted-foreground" />
                                <div>
                                    <Label className="text-sm font-medium">SSL / TLS</Label>
                                    <p className="text-xs text-muted-foreground">Require encrypted connection</p>
                                </div>
                            </div>
                            <FormField control={form.control} name="ssl_mode" render={({ field }) => (
                                <Switch checked={field.value} onCheckedChange={field.onChange} />
                            )} />
                        </div>
                        {/* Test Connection */}
                        <div className="flex items-center gap-3 pt-1">
                            <Button type="button" variant="outline" size="sm" disabled={testing}
                                onClick={async () => {
                                    setTesting(true); setTestResult(null);
                                    const vals = form.getValues();
                                    try {
                                        const config: Record<string, unknown> = { host: vals.host, port: parseInt(vals.port || "0", 10), database: vals.database, username: vals.username, password: vals.password };
                                        if (vals.ssl_mode) config.ssl_mode = "require";
                                        await api.post("/api/discovery/sources", { name: `__test_${Date.now()}`, type: vals.type, configuration: config, dry_run: true });
                                        setTestResult({ success: true, message: "Connection OK" });
                                    } catch (err: any) {
                                        setTestResult({ success: false, message: err?.response?.data?.error || err.message || "Connection failed" });
                                    } finally { setTesting(false); }
                                }}
                            >
                                {testing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Database className="mr-2 h-4 w-4" />}
                                {testing ? "Testing…" : "Test Connection"}
                            </Button>
                            {testResult && (
                                <span className={`flex items-center gap-1 text-xs ${testResult.success ? "text-emerald-600" : "text-destructive"}`}>
                                    {testResult.success ? <CheckCircle className="h-3.5 w-3.5" /> : <XCircle className="h-3.5 w-3.5" />}
                                    {testResult.message}
                                </span>
                            )}
                        </div>
                    </div>
                )}

                {isS3 && (
                    <div className="space-y-4 rounded-lg border p-4 bg-muted/20">
                        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">S3 Details</p>
                        <FormField control={form.control} name="bucket" render={({ field }) => (
                            <FormItem><FormLabel>Bucket Name</FormLabel><FormControl><Input placeholder="my-company-data" {...field} /></FormControl><FormMessage /></FormItem>
                        )} />
                        <FormField control={form.control} name="region" render={({ field }) => (
                            <FormItem><FormLabel>Region</FormLabel><FormControl><Input placeholder="us-east-1" {...field} /></FormControl><FormMessage /></FormItem>
                        )} />
                        <FormField control={form.control} name="access_key" render={({ field }) => (
                            <FormItem><FormLabel>Access Key <span className="text-muted-foreground">(optional)</span></FormLabel><FormControl><Input placeholder="AKIA..." {...field} /></FormControl><FormMessage /></FormItem>
                        )} />
                        <FormField control={form.control} name="secret_key" render={({ field }) => (
                            <FormItem><FormLabel>Secret Key <span className="text-muted-foreground">(optional)</span></FormLabel><FormControl><Input type="password" placeholder="••••••••" {...field} /></FormControl><FormMessage /></FormItem>
                        )} />
                    </div>
                )}

                {isAgent && (
                    <div className="space-y-4 rounded-lg border p-4 bg-muted/20">
                        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                            {watchedType === "agent_linux" ? "Linux" : "Windows"} Agent Configuration
                        </p>
                        <p className="text-xs text-muted-foreground">Deploy the agent on the target machine and enter the connection details below.</p>
                        <FormField control={form.control} name="agent_id" render={({ field }) => (
                            <FormItem><FormLabel>Agent ID</FormLabel><FormControl><Input placeholder="agent-xyz-001" {...field} /></FormControl><FormMessage /></FormItem>
                        )} />
                        <FormField control={form.control} name="api_key" render={({ field }) => (
                            <FormItem><FormLabel>API Key</FormLabel><FormControl><Input type="password" placeholder="••••••••" {...field} /></FormControl><FormMessage /></FormItem>
                        )} />
                    </div>
                )}

                <FormField control={form.control} name="worker_group" render={({ field }) => (
                    <FormItem><FormLabel>Worker Group <span className="text-muted-foreground">(optional)</span></FormLabel>
                        <FormControl><Input placeholder="default" {...field} /></FormControl><FormMessage />
                    </FormItem>
                )} />
                <div className="flex justify-end pt-2">
                    <Button type="submit" disabled={isPending}>{isPending ? "Registering…" : "Register Source"}</Button>
                </div>
            </form>
        </Form>
    );
}

// ── Trigger Scan Dialog ────────────────────────────────────────────────────

function TriggerScanDialog({ source, open, onClose }: { source: Source | null; open: boolean; onClose: () => void }) {
    const { data: profiles } = useProfiles();
    const { mutate: triggerScan, isPending } = useTriggerScan();
    const [profileId, setProfileId] = useState("");

    const handleScan = () => {
        if (!source) return;
        triggerScan(
            { source_id: source.id, type: source.type, profile_id: profileId || undefined },
            {
                onSuccess: () => { toast.success(`Scan queued for ${source.name}`); onClose(); },
                onError: (err: any) => toast.error(err?.response?.data?.error || "Failed to trigger scan."),
            }
        );
    };

    return (
        <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>Trigger Scan</DialogTitle>
                    <DialogDescription>
                        Start a PII scan on <strong>{source?.name}</strong>.
                    </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-2">
                    <div className="space-y-1.5">
                        <p className="text-sm font-medium">Scan Profile <span className="text-muted-foreground">(optional)</span></p>
                        <Select onValueChange={setProfileId} value={profileId}>
                            <SelectTrigger><SelectValue placeholder="— Default profile —" /></SelectTrigger>
                            <SelectContent>
                                {profiles?.map((p) => (
                                    <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                </div>
                <DialogFooter>
                    <Button variant="outline" onClick={onClose}>Cancel</Button>
                    <Button onClick={handleScan} disabled={isPending}>
                        <Play className="mr-2 h-4 w-4" />{isPending ? "Queuing…" : "Start Scan"}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

// ── Schedule Dialog ────────────────────────────────────────────────────────

const FREQUENCY_OPTIONS = [
    { value: "@hourly", label: "Every Hour" },
    { value: "@daily", label: "Daily" },
    { value: "@weekly", label: "Weekly" },
    { value: "@monthly", label: "Monthly" },
    { value: "0 */6 * * *", label: "Every 6 Hours" },
    { value: "0 */12 * * *", label: "Every 12 Hours" },
];

function ScheduleDialog({ source, open, onClose }: { source: Source | null; open: boolean; onClose: () => void }) {
    const { data: profiles } = useProfiles();
    const { mutate: createSchedule, isPending } = useCreateSchedule();
    const [frequency, setFrequency] = useState("@daily");
    const [profileId, setProfileId] = useState("");

    const handleSchedule = () => {
        if (!source) return;
        createSchedule(
            { source_id: source.id, frequency, profile_id: profileId || undefined },
            {
                onSuccess: () => { toast.success(`Schedule created for ${source.name}`); onClose(); },
                onError: (err: any) => toast.error(err?.response?.data?.error || "Failed to create schedule."),
            }
        );
    };

    return (
        <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>Schedule Scan</DialogTitle>
                    <DialogDescription>
                        Set up automatic recurring scans for <strong>{source?.name}</strong>.
                    </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-2">
                    <div className="space-y-1.5">
                        <p className="text-sm font-medium">Frequency</p>
                        <Select onValueChange={setFrequency} value={frequency}>
                            <SelectTrigger><SelectValue placeholder="Select frequency" /></SelectTrigger>
                            <SelectContent>
                                {FREQUENCY_OPTIONS.map((f) => (
                                    <SelectItem key={f.value} value={f.value}>{f.label}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="space-y-1.5">
                        <p className="text-sm font-medium">Scan Profile <span className="text-muted-foreground">(optional)</span></p>
                        <Select onValueChange={setProfileId} value={profileId}>
                            <SelectTrigger><SelectValue placeholder="— Default profile —" /></SelectTrigger>
                            <SelectContent>
                                {profiles?.map((p) => (
                                    <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                </div>
                <DialogFooter>
                    <Button variant="outline" onClick={onClose}>Cancel</Button>
                    <Button onClick={handleSchedule} disabled={isPending}>
                        <Calendar className="mr-2 h-4 w-4" />{isPending ? "Creating…" : "Create Schedule"}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function DataSourcesPage() {
    const [sheetOpen, setSheetOpen] = useState(false);
    const [scanTarget, setScanTarget] = useState<Source | null>(null);
    const [deleteTarget, setDeleteTarget] = useState<Source | null>(null);
    const [scheduleTarget, setScheduleTarget] = useState<Source | null>(null);

    const { data: sources, isLoading, isError } = useSources();
    const { mutate: deleteSource, isPending: isDeleting } = useDeleteSource();
    const { data: schedules } = useSchedules();
    const { data: jobs } = useJobs(1, 10);

    // Compute summary metrics
    const totalSources = sources?.length ?? 0;
    const activeSchedules = schedules?.length ?? 0;
    const lastScanned = jobs?.length
        ? jobs.reduce((latest, j) => {
            const d = j.created_at ? new Date(j.created_at).getTime() : 0;
            return d > latest ? d : latest;
        }, 0)
        : 0;

    const handleDelete = () => {
        if (!deleteTarget) return;
        deleteSource(deleteTarget.id, {
            onSuccess: () => { toast.success(`${deleteTarget.name} removed.`); setDeleteTarget(null); },
            onError: (err: any) => toast.error(err?.response?.data?.error || "Failed to delete source."),
        });
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold tracking-tight">Data Sources</h2>
                    <p className="text-sm text-muted-foreground">Connect and manage repositories for PII scanning.</p>
                </div>
                <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
                    <SheetTrigger asChild>
                        <Button><Plus className="mr-2 h-4 w-4" />Register Source</Button>
                    </SheetTrigger>
                    <SheetContent className="sm:max-w-lg overflow-y-auto">
                        <SheetHeader>
                            <SheetTitle>Register New Data Source</SheetTitle>
                            <SheetDescription>Connect a database, cloud bucket, or agent to begin automated PII discovery.</SheetDescription>
                        </SheetHeader>
                        <RegisterSourceForm onSuccess={() => setSheetOpen(false)} />
                    </SheetContent>
                </Sheet>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">Total Sources</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-bold">{isLoading ? "—" : totalSources}</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">Active Schedules</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-bold">{activeSchedules}</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">Last Scanned</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-lg font-semibold">
                            {lastScanned ? new Date(lastScanned).toLocaleString() : "Never"}
                        </div>
                    </CardContent>
                </Card>
            </div>

            {isLoading && <div className="space-y-3">{Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-12 w-full rounded-md" />)}</div>}
            {isError && <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-4 text-sm text-destructive">Failed to load data sources.</div>}

            {sources && (
                <div className="rounded-lg border">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Name</TableHead>
                                <TableHead>Type</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead className="text-right">Registered</TableHead>
                                <TableHead className="text-right">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {sources.length === 0 ? (
                                <TableRow><TableCell colSpan={5} className="h-32 text-center text-muted-foreground">No data sources connected. Click "Register Source" to add one.</TableCell></TableRow>
                            ) : (
                                sources.map((s) => (
                                    <TableRow key={s.id}>
                                        <TableCell className="font-medium">
                                            <span className="flex items-center gap-2">{typeIconEl(s.type)}{s.name}</span>
                                        </TableCell>
                                        <TableCell><Badge variant="outline" className="capitalize">{s.type}</Badge></TableCell>
                                        <TableCell>
                                            {s.status ? (
                                                <Badge variant="outline" className={s.status === "active" ? "bg-emerald-500/15 text-emerald-700 border-emerald-500/25" : "bg-amber-500/15 text-amber-700 border-amber-500/25"}>
                                                    {s.status}
                                                </Badge>
                                            ) : <span className="text-muted-foreground text-sm">—</span>}
                                        </TableCell>
                                        <TableCell className="text-right text-sm text-muted-foreground">
                                            {s.created_at ? new Date(s.created_at).toLocaleDateString() : "—"}
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <div className="flex items-center justify-end gap-1">
                                                <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-primary" title="Trigger Scan" onClick={() => setScanTarget(s)}>
                                                    <Play className="h-4 w-4" />
                                                </Button>
                                                <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-amber-600" title="Schedule Scan" onClick={() => setScheduleTarget(s)}>
                                                    <Calendar className="h-4 w-4" />
                                                </Button>
                                                <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-destructive" title="Delete" onClick={() => setDeleteTarget(s)}>
                                                    <Trash2 className="h-4 w-4" />
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

            {/* Trigger Scan Dialog */}
            <TriggerScanDialog source={scanTarget} open={!!scanTarget} onClose={() => setScanTarget(null)} />

            {/* Schedule Dialog */}
            <ScheduleDialog source={scheduleTarget} open={!!scheduleTarget} onClose={() => setScheduleTarget(null)} />

            {/* Delete Confirm */}
            <AlertDialog open={!!deleteTarget} onOpenChange={(v) => !v && setDeleteTarget(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Delete {deleteTarget?.name}?</AlertDialogTitle>
                        <AlertDialogDescription>This will permanently remove the data source. Existing scan jobs will not be affected.</AlertDialogDescription>
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
