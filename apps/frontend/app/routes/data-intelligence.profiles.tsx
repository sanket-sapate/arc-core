import { useState } from "react";
import { Plus, Trash2, BookOpen, Tag, Pencil } from "lucide-react";
import { toast } from "sonner";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";

import { Button } from "~/components/ui/button";
import { Badge } from "~/components/ui/badge";
import { Skeleton } from "~/components/ui/skeleton";
import {
    Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger,
} from "~/components/ui/sheet";
import {
    Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "~/components/ui/table";
import {
    Form, FormControl, FormField, FormItem, FormLabel, FormMessage,
} from "~/components/ui/form";
import { Input } from "~/components/ui/input";
import { Textarea } from "~/components/ui/textarea";
import {
    AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
    AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "~/components/ui/alert-dialog";
import {
    Tabs, TabsContent, TabsList, TabsTrigger,
} from "~/components/ui/tabs";

import { useRules, useCreateRule, useDeleteRule, type DLPRule } from "~/features/data-intelligence/api/rules";
import { useProfiles, useCreateProfile, useDeleteProfile, useProfileDetails, useAssignRuleToProfile, useRemoveRuleFromProfile, type ScanProfile } from "~/features/data-intelligence/api/profiles";

// ── Schemas ─────────────────────────────────────────────────────────────────

const ruleSchema = z.object({
    name: z.string().min(1, "Required"),
    info_type: z.string().min(1, "Required"),
    pattern: z.string().optional(),
    description: z.string().optional(),
});
type RuleForm = z.infer<typeof ruleSchema>;

const profileSchema = z.object({
    name: z.string().min(1, "Required"),
    description: z.string().optional(),
});
type ProfileForm = z.infer<typeof profileSchema>;

// ── Rules Tab ────────────────────────────────────────────────────────────────

function RulesTab() {
    const { data: rules, isLoading, isError } = useRules();
    const { mutate: createRule, isPending: isCreating } = useCreateRule();
    const { mutate: deleteRule } = useDeleteRule();
    const [sheetOpen, setSheetOpen] = useState(false);
    const [deleteTarget, setDeleteTarget] = useState<DLPRule | null>(null);

    const form = useForm<RuleForm>({
        resolver: zodResolver(ruleSchema),
        defaultValues: { name: "", info_type: "", pattern: "", description: "" },
    });

    const onSubmit = (values: RuleForm) => {
        createRule(values, {
            onSuccess: () => { toast.success("Rule created."); form.reset(); setSheetOpen(false); },
            onError: (err: any) => toast.error(err?.response?.data?.error || "Failed to create rule."),
        });
    };

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <p className="text-sm text-muted-foreground">Define custom data detection patterns.</p>
                <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
                    <SheetTrigger asChild>
                        <Button size="sm"><Plus className="mr-2 h-4 w-4" />New Rule</Button>
                    </SheetTrigger>
                    <SheetContent className="sm:max-w-md overflow-y-auto">
                        <SheetHeader><SheetTitle>Create DLP Rule</SheetTitle><SheetDescription>Add a custom detection rule for PII scanning.</SheetDescription></SheetHeader>
                        <Form {...form}>
                            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 mt-6">
                                <FormField control={form.control} name="name" render={({ field }) => (
                                    <FormItem><FormLabel>Rule Name</FormLabel><FormControl><Input placeholder="SSN Detector" {...field} /></FormControl><FormMessage /></FormItem>
                                )} />
                                <FormField control={form.control} name="info_type" render={({ field }) => (
                                    <FormItem><FormLabel>Info Type</FormLabel><FormControl><Input placeholder="US_SOCIAL_SECURITY_NUMBER" {...field} /></FormControl><FormMessage /></FormItem>
                                )} />
                                <FormField control={form.control} name="pattern" render={({ field }) => (
                                    <FormItem><FormLabel>Regex Pattern <span className="text-muted-foreground">(optional)</span></FormLabel>
                                        <FormControl><Input placeholder="\d{3}-\d{2}-\d{4}" {...field} /></FormControl><FormMessage />
                                    </FormItem>
                                )} />
                                <FormField control={form.control} name="description" render={({ field }) => (
                                    <FormItem><FormLabel>Description</FormLabel><FormControl><Textarea placeholder="Detects US SSN…" {...field} /></FormControl><FormMessage /></FormItem>
                                )} />
                                <div className="flex justify-end pt-2">
                                    <Button type="submit" disabled={isCreating}>{isCreating ? "Creating…" : "Create Rule"}</Button>
                                </div>
                            </form>
                        </Form>
                    </SheetContent>
                </Sheet>
            </div>

            {isLoading && <div className="space-y-3">{Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-10 w-full" />)}</div>}
            {isError && <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-4 text-sm text-destructive">Failed to load rules.</div>}
            {rules && (
                <div className="rounded-lg border">
                    <Table>
                        <TableHeader><TableRow><TableHead>Name</TableHead><TableHead>Info Type</TableHead><TableHead>Pattern</TableHead><TableHead className="w-12" /></TableRow></TableHeader>
                        <TableBody>
                            {rules.length === 0 ? (
                                <TableRow><TableCell colSpan={4} className="h-24 text-center text-muted-foreground">No rules yet.</TableCell></TableRow>
                            ) : rules.map((r) => (
                                <TableRow key={r.id}>
                                    <TableCell className="font-medium">{r.name}</TableCell>
                                    <TableCell><Badge variant="outline" className="font-mono text-xs">{r.info_type}</Badge></TableCell>
                                    <TableCell className="font-mono text-xs text-muted-foreground">{r.pattern || "—"}</TableCell>
                                    <TableCell>
                                        <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-destructive" onClick={() => setDeleteTarget(r)}>
                                            <Trash2 className="h-3.5 w-3.5" />
                                        </Button>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </div>
            )}

            <AlertDialog open={!!deleteTarget} onOpenChange={(v) => !v && setDeleteTarget(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader><AlertDialogTitle>Delete rule "{deleteTarget?.name}"?</AlertDialogTitle><AlertDialogDescription>This rule will be removed from all profiles that use it.</AlertDialogDescription></AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction className="bg-destructive text-destructive-foreground hover:bg-destructive/90" onClick={() => deleteTarget && deleteRule(deleteTarget.id, { onSuccess: () => { toast.success("Rule deleted."); setDeleteTarget(null); }, onError: () => toast.error("Failed to delete rule.") })}>Delete</AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}

// ── Profiles Tab ─────────────────────────────────────────────────────────────

function ProfileDetail({ profileId, rules }: { profileId: string; rules?: DLPRule[] }) {
    const { data, isLoading } = useProfileDetails(profileId);
    const { mutate: assign } = useAssignRuleToProfile();
    const { mutate: remove } = useRemoveRuleFromProfile();

    if (isLoading) return <Skeleton className="h-40 w-full" />;
    const assignedRuleIds = new Set((data?.rules ?? []).map((r: any) => r.id));

    return (
        <div className="rounded-lg border p-4 space-y-3">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Assigned Rules</p>
            {!rules?.length && <p className="text-sm text-muted-foreground">No rules available.</p>}
            <div className="flex flex-wrap gap-2">
                {rules?.map((r) => {
                    const assigned = assignedRuleIds.has(r.id);
                    return (
                        <Badge
                            key={r.id}
                            variant={assigned ? "default" : "outline"}
                            className={`cursor-pointer select-none ${assigned ? "bg-primary/15 text-primary border-primary/25" : ""}`}
                            onClick={() => {
                                if (assigned) {
                                    remove({ profileId, ruleId: r.id }, { onSuccess: () => toast.success(`Removed ${r.name}`), onError: () => toast.error("Failed to remove rule") });
                                } else {
                                    assign({ profileId, ruleId: r.id }, { onSuccess: () => toast.success(`Added ${r.name}`), onError: () => toast.error("Failed to add rule") });
                                }
                            }}
                        >
                            <Tag className="mr-1 h-3 w-3" />{r.name}
                        </Badge>
                    );
                })}
            </div>
        </div>
    );
}

function ProfilesTab() {
    const { data: profiles, isLoading, isError } = useProfiles();
    const { data: rules } = useRules();
    const { mutate: createProfile, isPending: isCreating } = useCreateProfile();
    const { mutate: deleteProfile } = useDeleteProfile();
    const [sheetOpen, setSheetOpen] = useState(false);
    const [expanded, setExpanded] = useState<string | null>(null);
    const [deleteTarget, setDeleteTarget] = useState<ScanProfile | null>(null);

    const form = useForm<ProfileForm>({
        resolver: zodResolver(profileSchema),
        defaultValues: { name: "", description: "" },
    });

    const onSubmit = (values: ProfileForm) => {
        createProfile(values, {
            onSuccess: () => { toast.success("Profile created."); form.reset(); setSheetOpen(false); },
            onError: (err: any) => toast.error(err?.response?.data?.error || "Failed to create profile."),
        });
    };

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <p className="text-sm text-muted-foreground">Group rules into profiles to use when triggering scans.</p>
                <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
                    <SheetTrigger asChild>
                        <Button size="sm"><Plus className="mr-2 h-4 w-4" />New Profile</Button>
                    </SheetTrigger>
                    <SheetContent className="sm:max-w-md">
                        <SheetHeader><SheetTitle>Create Scan Profile</SheetTitle><SheetDescription>Group DLP rules into a reusable scan profile.</SheetDescription></SheetHeader>
                        <Form {...form}>
                            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 mt-6">
                                <FormField control={form.control} name="name" render={({ field }) => (
                                    <FormItem><FormLabel>Profile Name</FormLabel><FormControl><Input placeholder="Comprehensive PII" {...field} /></FormControl><FormMessage /></FormItem>
                                )} />
                                <FormField control={form.control} name="description" render={({ field }) => (
                                    <FormItem><FormLabel>Description</FormLabel><FormControl><Textarea placeholder="Detects all PII types…" {...field} /></FormControl><FormMessage /></FormItem>
                                )} />
                                <div className="flex justify-end pt-2">
                                    <Button type="submit" disabled={isCreating}>{isCreating ? "Creating…" : "Create"}</Button>
                                </div>
                            </form>
                        </Form>
                    </SheetContent>
                </Sheet>
            </div>

            {isLoading && <div className="space-y-3">{Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-14 w-full" />)}</div>}
            {isError && <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-4 text-sm text-destructive">Failed to load profiles.</div>}

            {profiles && (
                <div className="space-y-2">
                    {profiles.length === 0 && <p className="text-center text-sm text-muted-foreground py-10">No profiles yet.</p>}
                    {profiles.map((p) => (
                        <div key={p.id} className="rounded-lg border overflow-hidden">
                            <div
                                className="flex items-center justify-between p-4 cursor-pointer hover:bg-muted/40"
                                onClick={() => setExpanded(expanded === p.id ? null : p.id)}
                            >
                                <div className="flex items-center gap-3">
                                    <BookOpen className="h-4 w-4 text-muted-foreground" />
                                    <div>
                                        <p className="font-medium text-sm">{p.name}</p>
                                        {p.description && <p className="text-xs text-muted-foreground">{p.description}</p>}
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    {p.rule_count !== undefined && <Badge variant="outline">{p.rule_count} rules</Badge>}
                                    <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-destructive" onClick={(e) => { e.stopPropagation(); setDeleteTarget(p); }}>
                                        <Trash2 className="h-3.5 w-3.5" />
                                    </Button>
                                    <ChevronRight className={`h-4 w-4 text-muted-foreground transition-transform ${expanded === p.id ? "rotate-90" : ""}`} />
                                </div>
                            </div>
                            {expanded === p.id && (
                                <div className="border-t p-4 bg-muted/20">
                                    <ProfileDetail profileId={p.id} rules={rules} />
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            )}

            <AlertDialog open={!!deleteTarget} onOpenChange={(v) => !v && setDeleteTarget(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader><AlertDialogTitle>Delete "{deleteTarget?.name}"?</AlertDialogTitle><AlertDialogDescription>This profile will be permanently removed.</AlertDialogDescription></AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction className="bg-destructive text-destructive-foreground hover:bg-destructive/90" onClick={() => deleteTarget && deleteProfile(deleteTarget.id, { onSuccess: () => { toast.success("Profile deleted."); setDeleteTarget(null); }, onError: () => toast.error("Failed.") })}>Delete</AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function ProfilesPage() {
    return (
        <div className="space-y-6">
            <div>
                <h2 className="text-2xl font-bold tracking-tight">Scan Profiles & Rules</h2>
                <p className="text-sm text-muted-foreground">Manage DLP rules and bundle them into scan profiles.</p>
            </div>
            <Tabs defaultValue="profiles">
                <TabsList>
                    <TabsTrigger value="profiles"><BookOpen className="mr-2 h-4 w-4" />Profiles</TabsTrigger>
                    <TabsTrigger value="rules"><Tag className="mr-2 h-4 w-4" />Rules</TabsTrigger>
                </TabsList>
                <TabsContent value="profiles" className="mt-4"><ProfilesTab /></TabsContent>
                <TabsContent value="rules" className="mt-4"><RulesTab /></TabsContent>
            </Tabs>
        </div>
    );
}
