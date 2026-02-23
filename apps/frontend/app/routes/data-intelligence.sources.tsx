import { useState } from "react";
import { Plus, Database, Cloud, Server, HardDrive, Play, Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

import { Button } from "~/components/ui/button";
import { Badge } from "~/components/ui/badge";
import { Skeleton } from "~/components/ui/skeleton";
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
import { useTriggerScan } from "~/features/data-intelligence/api/jobs";

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

const formSchema = z.object({
    name: z.string().min(1, "Name is required"),
    type: z.string().min(1, "Type is required"),
    host: z.string().optional(),
    port: z.string().optional(),
    database: z.string().optional(),
    username: z.string().optional(),
    password: z.string().optional(),
    bucket: z.string().optional(),
    region: z.string().optional(),
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
    const form = useForm<FormValues>({
        resolver: zodResolver(formSchema),
        defaultValues: { name: "", type: "", host: "", port: "", database: "", username: "", password: "", bucket: "", region: "", worker_group: "" },
    });
    const watchedType = form.watch("type") as SourceType;
    const isDB = DB_TYPES.includes(watchedType);
    const isS3 = S3_TYPES.includes(watchedType);

    const onSubmit = (values: FormValues) => {
        // Build the correct `configuration` sub-object expected by the scanner API
        const configuration: Record<string, unknown> = {};
        if (isDB) {
            if (values.host) configuration.host = values.host;
            if (values.port) configuration.port = parseInt(values.port, 10);
            if (values.database) configuration.database = values.database;
            if (values.username) configuration.username = values.username;
            if (values.password) configuration.password = values.password;
        }
        if (isS3) {
            if (values.bucket) configuration.bucket = values.bucket;
            if (values.region) configuration.region = values.region;
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
                                <FormItem><FormLabel>Port</FormLabel><FormControl><Input placeholder="5432" {...field} /></FormControl><FormMessage /></FormItem>
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
            { source_id: source.id, profile_id: profileId || undefined },
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

// ── Page ──────────────────────────────────────────────────────────────────────

export default function DataSourcesPage() {
    const [sheetOpen, setSheetOpen] = useState(false);
    const [scanTarget, setScanTarget] = useState<Source | null>(null);
    const [deleteTarget, setDeleteTarget] = useState<Source | null>(null);

    const { data: sources, isLoading, isError } = useSources();
    const { mutate: deleteSource, isPending: isDeleting } = useDeleteSource();

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
