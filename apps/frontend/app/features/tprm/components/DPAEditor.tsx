import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { useVendors } from "../api/vendors";
import { useDictionaryItems } from "~/features/data-intelligence/api/dictionary";
import type { Dpa } from "../types/dpa";
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "~/components/ui/form";
import { Input } from "~/components/ui/input";
import { Textarea } from "~/components/ui/textarea";
import { Button } from "~/components/ui/button";
import { Badge } from "~/components/ui/badge";
import { Label } from "~/components/ui/label";
import { Checkbox } from "~/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "~/components/ui/select";
import { Skeleton } from "~/components/ui/skeleton";
import {
    Building2,
    Scale,
    ShieldCheck,
    Database,
    FileCheck,
    ChevronRight,
    ChevronLeft,
    Plus,
    X,
    Check,
} from "lucide-react";

// ── Wizard Schema ──────────────────────────────────────────────────────────
const dpaWizardSchema = z.object({
    vendor_id: z.string().min(1, "Vendor must be selected"),
    role: z.enum(["controller", "processor"]).default("controller"),
    status: z.enum(["draft", "sent", "signed", "expired"]).default("draft"),
    effective_date: z.string().optional().default(""),
    jurisdiction: z.enum(["GDPR", "CCPA", "DPDPA"]).default("GDPR"),
    processing_purpose: z.string().optional().default(""),
    duration: z.string().optional().default(""),
    breach_notification_time: z.enum(["24 hours", "72 hours"]).default("72 hours"),
    data_subjects: z.array(z.string()).default([]),
    sub_processors: z.array(z.object({
        name: z.string(),
        services_provided: z.string(),
        location: z.string(),
    })).default([]),
    security_certifications: z.array(z.string()).default([]),
    data_object_ids: z.array(z.string()).default([]),
    notes: z.string().optional().default(""),
});

type DPAWizardData = z.infer<typeof dpaWizardSchema>;

// ── Constants ──────────────────────────────────────────────────────────────
const DATA_SUBJECT_OPTIONS = [
    "Employees", "Customers", "Contractors", "Website Visitors",
    "Job Applicants", "Minors", "Patients", "Students",
];

const CERTIFICATION_OPTIONS = [
    "ISO 27001", "SOC 2 Type II", "GDPR Compliant", "HIPAA",
    "PCI DSS", "ISO 27701", "CSA STAR", "FedRAMP",
];

const STEPS = [
    { label: "Vendor & Role", icon: Building2 },
    { label: "Scope & Jurisdiction", icon: Scale },
    { label: "Sub-processors & Security", icon: ShieldCheck },
    { label: "Data Objects", icon: Database },
    { label: "Review", icon: FileCheck },
];

// ── Component ──────────────────────────────────────────────────────────────
export interface DPASubmitPayload extends Dpa {
    data_object_ids?: string[];
}

interface DPAEditorProps {
    initialData?: Dpa;
    onSubmit: (data: DPASubmitPayload) => void;
    isLoading?: boolean;
}

export function DPAEditor({ initialData, onSubmit, isLoading }: DPAEditorProps) {
    const { data: vendors, isLoading: isVendorsLoading } = useVendors();
    const { data: dictionaryItems, isLoading: isDictLoading } = useDictionaryItems();
    const [step, setStep] = useState(0);
    const [newSubName, setNewSubName] = useState("");
    const [newSubService, setNewSubService] = useState("");
    const [newSubLocation, setNewSubLocation] = useState("");

    const form = useForm<DPAWizardData>({
        resolver: zodResolver(dpaWizardSchema) as any,
        defaultValues: {
            vendor_id: initialData?.vendor_id || "",
            role: "controller",
            status: initialData?.status || "draft",
            effective_date: initialData?.effective_date || "",
            jurisdiction: "GDPR",
            processing_purpose: "",
            duration: "",
            breach_notification_time: "72 hours",
            data_subjects: [],
            sub_processors: [],
            security_certifications: [],
            data_object_ids: [],
            notes: initialData?.notes || "",
        },
    });

    const values = form.watch();

    const validateStep = (): boolean => {
        if (step === 0 && !values.vendor_id) {
            toast.error("Please select a vendor");
            return false;
        }
        return true;
    };

    const next = () => { if (validateStep()) setStep((s) => Math.min(s + 1, STEPS.length - 1)); };
    const prev = () => setStep((s) => Math.max(s - 1, 0));

    const handleFinalSubmit = () => {
        const data = form.getValues();
        onSubmit({
            vendor_id: data.vendor_id,
            status: data.status,
            effective_date: data.effective_date,
            notes: data.notes,
            data_object_ids: data.data_object_ids,
        } as DPASubmitPayload);
    };

    const addSubProcessor = () => {
        if (!newSubName.trim()) return;
        const current = form.getValues("sub_processors");
        form.setValue("sub_processors", [
            ...current,
            { name: newSubName.trim(), services_provided: newSubService.trim(), location: newSubLocation.trim() },
        ]);
        setNewSubName("");
        setNewSubService("");
        setNewSubLocation("");
    };

    const removeSubProcessor = (idx: number) => {
        const current = form.getValues("sub_processors");
        form.setValue("sub_processors", current.filter((_, i) => i !== idx));
    };

    const toggleArrayItem = (field: "data_subjects" | "security_certifications" | "data_object_ids", item: string) => {
        const current = form.getValues(field);
        if (current.includes(item)) {
            form.setValue(field, current.filter((v) => v !== item));
        } else {
            form.setValue(field, [...current, item]);
        }
    };

    const getVendorName = (id: string) => vendors?.find((v) => v.id === id)?.name || id;

    // ── Render ──────────────────────────────────────────────────────────────
    return (
        <Form {...form}>
            <form onSubmit={(e) => e.preventDefault()} className="space-y-4">

                {/* ── Step Indicator ─────────────────────────────────────── */}
                <div className="flex items-center justify-between mb-6">
                    {STEPS.map((s, i) => {
                        const Icon = s.icon;
                        const isActive = i === step;
                        const isDone = i < step;
                        return (
                            <div key={i} className="flex items-center gap-1 flex-1">
                                <div className={`flex items-center justify-center w-8 h-8 rounded-full text-xs font-bold shrink-0 ${
                                    isDone ? "bg-primary text-primary-foreground" :
                                    isActive ? "bg-primary text-primary-foreground ring-2 ring-primary/30" :
                                    "bg-muted text-muted-foreground"
                                }`}>
                                    {isDone ? <Check className="h-4 w-4" /> : <Icon className="h-4 w-4" />}
                                </div>
                                <span className={`text-xs hidden sm:inline truncate ${isActive ? "font-semibold" : "text-muted-foreground"}`}>
                                    {s.label}
                                </span>
                                {i < STEPS.length - 1 && (
                                    <div className={`flex-1 h-px mx-1 ${isDone ? "bg-primary" : "bg-border"}`} />
                                )}
                            </div>
                        );
                    })}
                </div>

                {/* ── Step 0: Vendor & Role ──────────────────────────────── */}
                {step === 0 && (
                    <div className="space-y-4">
                        <div className="rounded-lg border p-4 space-y-4">
                            <h3 className="font-semibold text-sm">Vendor & Role</h3>

                            <FormField control={form.control} name="vendor_id" render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Vendor / Processor</FormLabel>
                                    <Select onValueChange={field.onChange} defaultValue={field.value} disabled={isVendorsLoading || !!initialData}>
                                        <FormControl>
                                            <SelectTrigger>
                                                {isVendorsLoading ? <Skeleton className="h-4 w-[150px]" /> : <SelectValue placeholder="Select a vendor" />}
                                            </SelectTrigger>
                                        </FormControl>
                                        <SelectContent>
                                            {vendors?.map((v) => <SelectItem key={v.id} value={v.id!}>{v.name}</SelectItem>)}
                                        </SelectContent>
                                    </Select>
                                    <FormMessage />
                                </FormItem>
                            )} />

                            <FormField control={form.control} name="role" render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Your Organization's Role</FormLabel>
                                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                                        <FormControl>
                                            <SelectTrigger><SelectValue /></SelectTrigger>
                                        </FormControl>
                                        <SelectContent>
                                            <SelectItem value="controller">Data Controller</SelectItem>
                                            <SelectItem value="processor">Data Processor</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </FormItem>
                            )} />

                            <div className="grid grid-cols-2 gap-4">
                                <FormField control={form.control} name="status" render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Status</FormLabel>
                                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                                            <FormControl>
                                                <SelectTrigger><SelectValue /></SelectTrigger>
                                            </FormControl>
                                            <SelectContent>
                                                <SelectItem value="draft">Draft</SelectItem>
                                                <SelectItem value="sent">Sent for Signature</SelectItem>
                                                <SelectItem value="signed">Signed & Active</SelectItem>
                                                <SelectItem value="expired">Expired</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </FormItem>
                                )} />

                                <FormField control={form.control} name="effective_date" render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Effective Date</FormLabel>
                                        <FormControl><Input type="date" {...field} /></FormControl>
                                    </FormItem>
                                )} />
                            </div>
                        </div>
                    </div>
                )}

                {/* ── Step 1: Scope & Jurisdiction ──────────────────────── */}
                {step === 1 && (
                    <div className="space-y-4">
                        <div className="rounded-lg border p-4 space-y-4">
                            <h3 className="font-semibold text-sm">Scope & Jurisdiction</h3>

                            <FormField control={form.control} name="jurisdiction" render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Applicable Regulation</FormLabel>
                                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                                        <FormControl>
                                            <SelectTrigger><SelectValue /></SelectTrigger>
                                        </FormControl>
                                        <SelectContent>
                                            <SelectItem value="GDPR">GDPR (EU)</SelectItem>
                                            <SelectItem value="CCPA">CCPA (California)</SelectItem>
                                            <SelectItem value="DPDPA">DPDPA (India)</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </FormItem>
                            )} />

                            <FormField control={form.control} name="processing_purpose" render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Processing Purpose</FormLabel>
                                    <FormControl>
                                        <Textarea placeholder="Describe the purpose of data processing..." className="resize-none" {...field} />
                                    </FormControl>
                                </FormItem>
                            )} />

                            <div className="grid grid-cols-2 gap-4">
                                <FormField control={form.control} name="duration" render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Agreement Duration</FormLabel>
                                        <FormControl><Input placeholder="e.g. 12 months" {...field} /></FormControl>
                                    </FormItem>
                                )} />

                                <FormField control={form.control} name="breach_notification_time" render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Breach Notification</FormLabel>
                                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                                            <FormControl>
                                                <SelectTrigger><SelectValue /></SelectTrigger>
                                            </FormControl>
                                            <SelectContent>
                                                <SelectItem value="24 hours">Within 24 hours</SelectItem>
                                                <SelectItem value="72 hours">Within 72 hours</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </FormItem>
                                )} />
                            </div>

                            <div>
                                <Label className="text-sm font-medium mb-2 block">Data Subjects</Label>
                                <div className="flex flex-wrap gap-2">
                                    {DATA_SUBJECT_OPTIONS.map((ds) => {
                                        const selected = values.data_subjects.includes(ds);
                                        return (
                                            <Badge
                                                key={ds}
                                                variant={selected ? "default" : "outline"}
                                                className="cursor-pointer select-none"
                                                onClick={() => toggleArrayItem("data_subjects", ds)}
                                            >
                                                {selected && <Check className="h-3 w-3 mr-1" />}
                                                {ds}
                                            </Badge>
                                        );
                                    })}
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* ── Step 2: Sub-processors & Security ─────────────────── */}
                {step === 2 && (
                    <div className="space-y-4">
                        <div className="rounded-lg border p-4 space-y-4">
                            <h3 className="font-semibold text-sm">Sub-processors</h3>

                            {values.sub_processors.length > 0 && (
                                <div className="space-y-2">
                                    {values.sub_processors.map((sp, i) => (
                                        <div key={i} className="flex items-center justify-between rounded-md border p-2 text-sm">
                                            <div>
                                                <span className="font-medium">{sp.name}</span>
                                                {sp.services_provided && <span className="text-muted-foreground"> — {sp.services_provided}</span>}
                                                {sp.location && <span className="text-muted-foreground"> ({sp.location})</span>}
                                            </div>
                                            <Button type="button" variant="ghost" size="sm" onClick={() => removeSubProcessor(i)}>
                                                <X className="h-3 w-3" />
                                            </Button>
                                        </div>
                                    ))}
                                </div>
                            )}

                            <div className="grid grid-cols-3 gap-2">
                                <Input placeholder="Name" value={newSubName} onChange={(e) => setNewSubName(e.target.value)} />
                                <Input placeholder="Service" value={newSubService} onChange={(e) => setNewSubService(e.target.value)} />
                                <div className="flex gap-1">
                                    <Input placeholder="Location" value={newSubLocation} onChange={(e) => setNewSubLocation(e.target.value)} />
                                    <Button type="button" variant="outline" size="icon" onClick={addSubProcessor} className="shrink-0">
                                        <Plus className="h-4 w-4" />
                                    </Button>
                                </div>
                            </div>
                        </div>

                        <div className="rounded-lg border p-4 space-y-4">
                            <h3 className="font-semibold text-sm">Security Certifications</h3>
                            <div className="flex flex-wrap gap-2">
                                {CERTIFICATION_OPTIONS.map((cert) => {
                                    const selected = values.security_certifications.includes(cert);
                                    return (
                                        <Badge
                                            key={cert}
                                            variant={selected ? "default" : "outline"}
                                            className="cursor-pointer select-none"
                                            onClick={() => toggleArrayItem("security_certifications", cert)}
                                        >
                                            {selected && <Check className="h-3 w-3 mr-1" />}
                                            {cert}
                                        </Badge>
                                    );
                                })}
                            </div>
                        </div>

                        <div className="rounded-lg border p-4 space-y-4">
                            <h3 className="font-semibold text-sm">Notes</h3>
                            <FormField control={form.control} name="notes" render={({ field }) => (
                                <FormItem>
                                    <FormControl>
                                        <Textarea placeholder="Tracking IDs, negotiation comments, or renewal dates..." className="resize-none" {...field} />
                                    </FormControl>
                                </FormItem>
                            )} />
                        </div>
                    </div>
                )}

                {/* ── Step 3: Data Objects ──────────────────────────────── */}
                {step === 3 && (
                    <div className="space-y-4">
                        <div className="rounded-lg border p-4 space-y-4">
                            <h3 className="font-semibold text-sm">Data Objects Shared with Vendor</h3>
                            <p className="text-xs text-muted-foreground">
                                Select the data objects that will be processed under this agreement. These come from your Data Dictionary.
                            </p>

                            {isDictLoading ? (
                                <div className="space-y-2">
                                    {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-10 w-full" />)}
                                </div>
                            ) : !dictionaryItems?.length ? (
                                <div className="text-center py-6 text-muted-foreground text-sm">
                                    <Database className="h-8 w-8 mx-auto mb-2 opacity-50" />
                                    <p>No data objects in your dictionary yet.</p>
                                    <p className="text-xs mt-1">Add items via Data Intelligence → Data Dictionary first.</p>
                                </div>
                            ) : (
                                <div className="grid grid-cols-1 gap-2 max-h-[300px] overflow-y-auto pr-1">
                                    {dictionaryItems.map((item) => {
                                        const selected = values.data_object_ids.includes(item.id);
                                        return (
                                            <div
                                                key={item.id}
                                                className={`flex items-center justify-between rounded-md border p-3 cursor-pointer transition-colors ${
                                                    selected ? "border-primary bg-primary/5" : "hover:bg-muted/50"
                                                }`}
                                                onClick={() => toggleArrayItem("data_object_ids", item.id)}
                                            >
                                                <div className="flex items-center gap-3">
                                                    <Checkbox checked={selected} tabIndex={-1} />
                                                    <div>
                                                        <span className="text-sm font-medium">{item.name}</span>
                                                        {item.category && (
                                                            <span className="text-xs text-muted-foreground ml-2">{item.category}</span>
                                                        )}
                                                    </div>
                                                </div>
                                                <Badge variant="outline" className="text-xs capitalize">{item.sensitivity}</Badge>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}

                            {values.data_object_ids.length > 0 && (
                                <p className="text-xs text-muted-foreground">
                                    {values.data_object_ids.length} data object{values.data_object_ids.length !== 1 ? "s" : ""} selected
                                </p>
                            )}
                        </div>
                    </div>
                )}

                {/* ── Step 4: Review ────────────────────────────────────── */}
                {step === 4 && (
                    <div className="space-y-4">
                        <div className="rounded-lg border p-4 space-y-3">
                            <h3 className="font-semibold text-sm">Agreement Summary</h3>
                            <div className="grid grid-cols-2 gap-x-6 gap-y-2 text-sm">
                                <div><span className="text-muted-foreground">Vendor:</span> <span className="font-medium">{getVendorName(values.vendor_id)}</span></div>
                                <div><span className="text-muted-foreground">Role:</span> <Badge variant="outline" className="capitalize ml-1">{values.role}</Badge></div>
                                <div><span className="text-muted-foreground">Status:</span> <Badge variant="secondary" className="capitalize ml-1">{values.status}</Badge></div>
                                <div><span className="text-muted-foreground">Effective:</span> <span className="font-medium">{values.effective_date || "Not set"}</span></div>
                                <div><span className="text-muted-foreground">Jurisdiction:</span> <Badge variant="outline" className="ml-1">{values.jurisdiction}</Badge></div>
                                <div><span className="text-muted-foreground">Breach Notice:</span> <span className="font-medium">{values.breach_notification_time}</span></div>
                                <div><span className="text-muted-foreground">Duration:</span> <span className="font-medium">{values.duration || "Not set"}</span></div>
                            </div>
                            {values.processing_purpose && (
                                <div className="text-sm"><span className="text-muted-foreground">Purpose:</span> <span>{values.processing_purpose}</span></div>
                            )}
                        </div>

                        {values.data_subjects.length > 0 && (
                            <div className="rounded-lg border p-4 space-y-2">
                                <h3 className="font-semibold text-sm">Data Subjects</h3>
                                <div className="flex flex-wrap gap-1">
                                    {values.data_subjects.map((ds) => <Badge key={ds} variant="secondary">{ds}</Badge>)}
                                </div>
                            </div>
                        )}

                        {values.sub_processors.length > 0 && (
                            <div className="rounded-lg border p-4 space-y-2">
                                <h3 className="font-semibold text-sm">Sub-processors ({values.sub_processors.length})</h3>
                                {values.sub_processors.map((sp, i) => (
                                    <div key={i} className="text-sm">
                                        <span className="font-medium">{sp.name}</span>
                                        {sp.services_provided && <span className="text-muted-foreground"> — {sp.services_provided}</span>}
                                        {sp.location && <span className="text-muted-foreground"> ({sp.location})</span>}
                                    </div>
                                ))}
                            </div>
                        )}

                        {values.security_certifications.length > 0 && (
                            <div className="rounded-lg border p-4 space-y-2">
                                <h3 className="font-semibold text-sm">Security Certifications</h3>
                                <div className="flex flex-wrap gap-1">
                                    {values.security_certifications.map((c) => <Badge key={c} variant="outline">{c}</Badge>)}
                                </div>
                            </div>
                        )}

                        {values.data_object_ids.length > 0 && (
                            <div className="rounded-lg border p-4 space-y-2">
                                <h3 className="font-semibold text-sm">Data Objects ({values.data_object_ids.length})</h3>
                                <div className="flex flex-wrap gap-1">
                                    {values.data_object_ids.map((id) => {
                                        const item = dictionaryItems?.find((d) => d.id === id);
                                        return <Badge key={id} variant="secondary">{item?.name || id.split("-")[0]}</Badge>;
                                    })}
                                </div>
                            </div>
                        )}

                        {values.notes && (
                            <div className="rounded-lg border p-4 space-y-2">
                                <h3 className="font-semibold text-sm">Notes</h3>
                                <p className="text-sm text-muted-foreground">{values.notes}</p>
                            </div>
                        )}
                    </div>
                )}

                {/* ── Navigation ─────────────────────────────────────────── */}
                <div className="flex justify-between pt-2">
                    <Button type="button" variant="outline" onClick={prev} disabled={step === 0}>
                        <ChevronLeft className="mr-1 h-4 w-4" /> Back
                    </Button>

                    {step < STEPS.length - 1 ? (
                        <Button type="button" onClick={next}>
                            Next <ChevronRight className="ml-1 h-4 w-4" />
                        </Button>
                    ) : (
                        <Button type="button" onClick={handleFinalSubmit} disabled={isLoading}>
                            {isLoading ? "Saving..." : initialData ? "Save Changes" : "Create Agreement"}
                        </Button>
                    )}
                </div>
            </form>
        </Form>
    );
}
