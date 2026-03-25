import { useState, useCallback } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
    wizardFormSchema,
    type WizardFormData,
    type Vendor,
    type SubProcessor,
} from "../types/vendor";
import {
    Form,
    FormControl,
    FormDescription,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "~/components/ui/form";
import { Input } from "~/components/ui/input";
import { Textarea } from "~/components/ui/textarea";
import { Button } from "~/components/ui/button";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "~/components/ui/select";
import { Checkbox } from "~/components/ui/checkbox";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { Badge } from "~/components/ui/badge";
import { Label } from "~/components/ui/label";
import {
    Building2,
    Shield,
    Users,
    CheckCircle2,
    ChevronLeft,
    ChevronRight,
    Plus,
    Trash2,
    AlertCircle,
    Check,
} from "lucide-react";
import { toast } from "sonner";

const WIZARD_STEPS = [
    { label: "Basic Info", icon: Building2 },
    { label: "Risk & Compliance", icon: Shield },
    { label: "Data & Certifications", icon: Users },
    { label: "Review", icon: CheckCircle2 },
];

const DATA_SUBJECT_OPTIONS = [
    "customers",
    "california_residents",
    "eu_residents",
    "employees",
    "contractors",
    "minors",
];

const CERTIFICATION_OPTIONS = [
    "ISO 27001",
    "SOC 2 Type II",
    "GDPR Compliant",
    "HIPAA Compliant",
    "PCI DSS",
];

interface VendorEditorProps {
    initialData?: Vendor;
    onSubmit: (data: Vendor) => void;
    isLoading?: boolean;
}

export function VendorEditor({
    initialData,
    onSubmit,
    isLoading,
}: VendorEditorProps) {
    const [currentStep, setCurrentStep] = useState(0);
    const isEditing = !!initialData;

    const form = useForm<WizardFormData>({
        resolver: zodResolver(wizardFormSchema) as any,
        defaultValues: {
            name: initialData?.name || "",
            contact_email: initialData?.contact_email || "",
            requires_assessment: initialData?.requires_assessment ?? true,
            requires_dpa: initialData?.requires_dpa ?? true,
            risk_level: initialData?.risk_level || "medium",
            compliance_status: initialData?.compliance_status || "under_review",
            description: initialData?.description || "",
            website: initialData?.website || "",
            data_subjects: [],
            security_certifications: [],
            processing_locations: "",
            sub_processors: [],
        },
    });

    const validateStep = useCallback(
        async (step: number): Promise<boolean> => {
            switch (step) {
                case 0: {
                    const valid = await form.trigger([
                        "name",
                        "contact_email",
                    ]);
                    if (!valid)
                        toast.error(
                            "Please fill in vendor name and contact email."
                        );
                    return valid;
                }
                case 1:
                    return await form.trigger([
                        "risk_level",
                        "compliance_status",
                    ]);
                default:
                    return true;
            }
        },
        [form]
    );

    const handleNext = async () => {
        const valid = await validateStep(currentStep);
        if (!valid) return;
        setCurrentStep((prev) =>
            Math.min(prev + 1, WIZARD_STEPS.length - 1)
        );
    };

    const handlePrevious = () => {
        setCurrentStep((prev) => Math.max(prev - 1, 0));
    };

    const handleFinalSubmit = () => {
        const data = form.getValues();
        const vendorPayload: Vendor = {
            ...(initialData || {}),
            name: data.name,
            contact_email: data.contact_email,
            description: data.description,
            website: data.website,
            risk_level: data.risk_level,
            compliance_status: data.compliance_status,
            active: initialData?.active ?? true,
            requires_dpa: data.requires_dpa,
            requires_assessment: data.requires_assessment,
        };
        onSubmit(vendorPayload);
    };

    const toggleArrayItem = (
        field: "data_subjects" | "security_certifications",
        item: string
    ) => {
        const current = form.getValues(field) || [];
        if (current.includes(item)) {
            form.setValue(
                field,
                current.filter((v) => v !== item),
                { shouldDirty: true }
            );
        } else {
            form.setValue(field, [...current, item], { shouldDirty: true });
        }
    };

    const addSubProcessor = () => {
        const current = form.getValues("sub_processors") || [];
        form.setValue("sub_processors", [
            ...current,
            { name: "", services_provided: "", location: "" },
        ]);
    };

    const removeSubProcessor = (index: number) => {
        const current = form.getValues("sub_processors") || [];
        form.setValue(
            "sub_processors",
            current.filter((_, i) => i !== index)
        );
    };

    const updateSubProcessor = (
        index: number,
        field: keyof SubProcessor,
        value: string
    ) => {
        const current = form.getValues("sub_processors") || [];
        form.setValue(
            "sub_processors",
            current.map((sp, i) =>
                i === index ? { ...sp, [field]: value } : sp
            )
        );
    };

    const watchedValues = form.watch();

    return (
        <Form {...form}>
            <div className="space-y-6">
                {/* ── Step Indicator ─────────────────────────────── */}
                <nav aria-label="Progress">
                    <ol className="flex items-center w-full">
                        {WIZARD_STEPS.map((step, index) => {
                            const isComplete = index < currentStep;
                            const isCurrent = index === currentStep;
                            const StepIcon = step.icon;
                            return (
                                <li
                                    key={step.label}
                                    className={`relative flex-1 ${
                                        index < WIZARD_STEPS.length - 1
                                            ? "pr-4 sm:pr-8"
                                            : ""
                                    }`}
                                >
                                    {index < WIZARD_STEPS.length - 1 && (
                                        <div
                                            className="absolute top-5 left-0 right-0 h-0.5"
                                            aria-hidden="true"
                                        >
                                            <div
                                                className={`h-full w-full ${
                                                    isComplete
                                                        ? "bg-primary"
                                                        : "bg-muted"
                                                }`}
                                            />
                                        </div>
                                    )}
                                    <button
                                        type="button"
                                        onClick={() =>
                                            index < currentStep &&
                                            setCurrentStep(index)
                                        }
                                        disabled={index > currentStep}
                                        className="relative flex flex-col items-center group cursor-default"
                                    >
                                        <span
                                            className={`w-10 h-10 flex items-center justify-center rounded-full border-2 transition-all ${
                                                isComplete
                                                    ? "bg-primary border-primary text-primary-foreground"
                                                    : isCurrent
                                                    ? "border-primary bg-background text-primary"
                                                    : "border-muted bg-background text-muted-foreground"
                                            } ${
                                                index < currentStep
                                                    ? "cursor-pointer group-hover:scale-110"
                                                    : ""
                                            }`}
                                        >
                                            {isComplete ? (
                                                <Check className="w-5 h-5" />
                                            ) : (
                                                <StepIcon className="w-4 h-4" />
                                            )}
                                        </span>
                                        <span
                                            className={`mt-2 text-xs font-medium ${
                                                isCurrent
                                                    ? "text-primary"
                                                    : isComplete
                                                    ? "text-foreground"
                                                    : "text-muted-foreground"
                                            }`}
                                        >
                                            {step.label}
                                        </span>
                                    </button>
                                </li>
                            );
                        })}
                    </ol>
                </nav>

                {/* ── Step 1: Basic Info ─────────────────────────── */}
                {currentStep === 0 && (
                    <div className="space-y-4 rounded-lg border p-4">
                        <h3 className="font-semibold text-sm flex items-center gap-2">
                            <Building2 className="w-4 h-4" /> Basic Vendor
                            Information
                        </h3>

                        <FormField
                            control={form.control}
                            name="name"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Vendor Name *</FormLabel>
                                    <FormControl>
                                        <Input
                                            placeholder="Acme Corp"
                                            {...field}
                                        />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="contact_email"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Contact Email *</FormLabel>
                                    <FormControl>
                                        <Input
                                            type="email"
                                            placeholder="privacy@acme.com"
                                            {...field}
                                        />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <div className="grid grid-cols-2 gap-4 pt-2">
                            <FormField
                                control={form.control}
                                name="requires_assessment"
                                render={({ field }) => (
                                    <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4 bg-secondary/50">
                                        <FormControl>
                                            <Checkbox
                                                checked={field.value}
                                                onCheckedChange={
                                                    field.onChange
                                                }
                                            />
                                        </FormControl>
                                        <div className="space-y-1 leading-none">
                                            <FormLabel className="cursor-pointer font-medium">
                                                Requires Assessment
                                            </FormLabel>
                                            <FormDescription className="text-xs">
                                                {field.value
                                                    ? "Vendor must complete a security assessment"
                                                    : "Vendor will be auto-approved (no assessment)"}
                                            </FormDescription>
                                        </div>
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name="requires_dpa"
                                render={({ field }) => (
                                    <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4 bg-secondary/50">
                                        <FormControl>
                                            <Checkbox
                                                checked={field.value}
                                                onCheckedChange={
                                                    field.onChange
                                                }
                                            />
                                        </FormControl>
                                        <div className="space-y-1 leading-none">
                                            <FormLabel className="cursor-pointer font-medium">
                                                Requires DPA
                                            </FormLabel>
                                            <FormDescription className="text-xs">
                                                {field.value
                                                    ? "Initiate a Data Processing Agreement"
                                                    : "Skip DPA-related data collection"}
                                            </FormDescription>
                                        </div>
                                    </FormItem>
                                )}
                            />
                        </div>

                        {!watchedValues.requires_assessment && (
                            <div className="flex items-start gap-3 p-4 border border-green-200 bg-green-50 dark:bg-green-950/30 dark:border-green-800 rounded-lg">
                                <AlertCircle className="w-5 h-5 text-green-600 mt-0.5 shrink-0" />
                                <div>
                                    <p className="font-medium text-green-900 dark:text-green-200 text-sm">
                                        Auto-Approved Status
                                    </p>
                                    <p className="text-xs text-green-700 dark:text-green-400 mt-1">
                                        This vendor will be automatically marked
                                        as ACTIVE upon creation.
                                    </p>
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {/* ── Step 2: Risk & Compliance ──────────────────── */}
                {currentStep === 1 && (
                    <div className="space-y-4 rounded-lg border p-4">
                        <h3 className="font-semibold text-sm flex items-center gap-2">
                            <Shield className="w-4 h-4" /> Risk & Compliance
                            Profile
                        </h3>

                        <div className="grid grid-cols-2 gap-4">
                            <FormField
                                control={form.control}
                                name="risk_level"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Risk Level</FormLabel>
                                        <Select
                                            onValueChange={field.onChange}
                                            value={field.value}
                                        >
                                            <FormControl>
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Select risk level" />
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent>
                                                <SelectItem value="low">
                                                    Low Risk
                                                </SelectItem>
                                                <SelectItem value="medium">
                                                    Medium Risk
                                                </SelectItem>
                                                <SelectItem value="high">
                                                    High Risk
                                                </SelectItem>
                                                <SelectItem value="critical">
                                                    Critical Risk
                                                </SelectItem>
                                            </SelectContent>
                                        </Select>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name="compliance_status"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>
                                            Compliance Status
                                        </FormLabel>
                                        <Select
                                            onValueChange={field.onChange}
                                            value={field.value}
                                        >
                                            <FormControl>
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Select status" />
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent>
                                                <SelectItem value="compliant">
                                                    Compliant
                                                </SelectItem>
                                                <SelectItem value="under_review">
                                                    Under Review
                                                </SelectItem>
                                                <SelectItem value="non_compliant">
                                                    Non-Compliant
                                                </SelectItem>
                                            </SelectContent>
                                        </Select>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>

                        <FormField
                            control={form.control}
                            name="website"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Website</FormLabel>
                                    <FormControl>
                                        <Input
                                            placeholder="https://example.com"
                                            {...field}
                                        />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="description"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Description</FormLabel>
                                    <FormControl>
                                        <Textarea
                                            placeholder="Brief overview of the external service or processor..."
                                            className="resize-none"
                                            {...field}
                                        />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                    </div>
                )}

                {/* ── Step 3: Data Subjects & Certifications ──────── */}
                {currentStep === 2 && (
                    <div className="space-y-6 rounded-lg border p-4">
                        <h3 className="font-semibold text-sm flex items-center gap-2">
                            <Users className="w-4 h-4" /> Data Subjects &
                            Certifications
                        </h3>

                        <div className="space-y-3">
                            <Label className="text-sm font-semibold">
                                Data Subjects
                            </Label>
                            <div className="grid grid-cols-2 gap-3">
                                {DATA_SUBJECT_OPTIONS.map((subject) => (
                                    <div
                                        key={subject}
                                        className="flex items-center space-x-2 p-3 border rounded-lg hover:bg-secondary/50 transition-colors"
                                    >
                                        <Checkbox
                                            id={`subject-${subject}`}
                                            checked={watchedValues.data_subjects?.includes(
                                                subject
                                            )}
                                            onCheckedChange={() =>
                                                toggleArrayItem(
                                                    "data_subjects",
                                                    subject
                                                )
                                            }
                                        />
                                        <Label
                                            htmlFor={`subject-${subject}`}
                                            className="font-normal capitalize cursor-pointer text-sm"
                                        >
                                            {subject.replace(/_/g, " ")}
                                        </Label>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="space-y-3">
                            <Label className="text-sm font-semibold">
                                Security Certifications
                            </Label>
                            <div className="grid grid-cols-2 gap-3">
                                {CERTIFICATION_OPTIONS.map((cert) => (
                                    <div
                                        key={cert}
                                        className="flex items-center space-x-2 p-3 border rounded-lg hover:bg-secondary/50 transition-colors"
                                    >
                                        <Checkbox
                                            id={`cert-${cert}`}
                                            checked={watchedValues.security_certifications?.includes(
                                                cert
                                            )}
                                            onCheckedChange={() =>
                                                toggleArrayItem(
                                                    "security_certifications",
                                                    cert
                                                )
                                            }
                                        />
                                        <Label
                                            htmlFor={`cert-${cert}`}
                                            className="font-normal cursor-pointer text-sm"
                                        >
                                            {cert}
                                        </Label>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <FormField
                            control={form.control}
                            name="processing_locations"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Processing Locations</FormLabel>
                                    <FormControl>
                                        <Textarea
                                            placeholder="e.g., United States, European Union, Singapore"
                                            rows={2}
                                            className="resize-none"
                                            {...field}
                                        />
                                    </FormControl>
                                    <FormDescription className="text-xs">
                                        Comma-separated list of data processing
                                        locations
                                    </FormDescription>
                                </FormItem>
                            )}
                        />

                        {/* Sub-Processors */}
                        <div className="space-y-3 pt-2">
                            <div className="flex items-center justify-between">
                                <Label className="text-sm font-semibold">
                                    Sub-Processors
                                </Label>
                                <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    onClick={addSubProcessor}
                                >
                                    <Plus className="w-3 h-3 mr-1" /> Add
                                </Button>
                            </div>

                            {watchedValues.sub_processors?.length === 0 ? (
                                <p className="text-muted-foreground text-center py-4 text-sm">
                                    No sub-processors added yet (optional).
                                </p>
                            ) : (
                                watchedValues.sub_processors?.map(
                                    (sp, index) => (
                                        <Card key={index} className="p-3">
                                            <div className="space-y-2">
                                                <div className="flex items-center justify-between">
                                                    <span className="text-xs font-medium text-muted-foreground">
                                                        Sub-Processor{" "}
                                                        {index + 1}
                                                    </span>
                                                    <Button
                                                        type="button"
                                                        variant="ghost"
                                                        size="sm"
                                                        onClick={() =>
                                                            removeSubProcessor(
                                                                index
                                                            )
                                                        }
                                                    >
                                                        <Trash2 className="w-3 h-3 text-destructive" />
                                                    </Button>
                                                </div>
                                                <div className="grid grid-cols-2 gap-2">
                                                    <Input
                                                        placeholder="Name"
                                                        value={sp.name}
                                                        onChange={(e) =>
                                                            updateSubProcessor(
                                                                index,
                                                                "name",
                                                                e.target.value
                                                            )
                                                        }
                                                        className="h-8 text-sm"
                                                    />
                                                    <Input
                                                        placeholder="Services Provided"
                                                        value={
                                                            sp.services_provided
                                                        }
                                                        onChange={(e) =>
                                                            updateSubProcessor(
                                                                index,
                                                                "services_provided",
                                                                e.target.value
                                                            )
                                                        }
                                                        className="h-8 text-sm"
                                                    />
                                                    <Input
                                                        placeholder="Location"
                                                        value={sp.location}
                                                        onChange={(e) =>
                                                            updateSubProcessor(
                                                                index,
                                                                "location",
                                                                e.target.value
                                                            )
                                                        }
                                                        className="col-span-2 h-8 text-sm"
                                                    />
                                                </div>
                                            </div>
                                        </Card>
                                    )
                                )
                            )}
                        </div>
                    </div>
                )}

                {/* ── Step 4: Review ─────────────────────────────── */}
                {currentStep === 3 && (
                    <div className="space-y-4">
                        <h3 className="font-semibold text-sm flex items-center gap-2">
                            <CheckCircle2 className="w-4 h-4" /> Review &
                            Submit
                        </h3>

                        <Card>
                            <CardHeader className="pb-2">
                                <CardTitle className="text-sm">
                                    Basic Information
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-1 text-sm">
                                <div>
                                    <strong>Name:</strong>{" "}
                                    {watchedValues.name}
                                </div>
                                <div>
                                    <strong>Email:</strong>{" "}
                                    {watchedValues.contact_email}
                                </div>
                                <div className="flex gap-2 pt-1">
                                    {watchedValues.requires_assessment ? (
                                        <Badge variant="outline">
                                            Requires Assessment
                                        </Badge>
                                    ) : (
                                        <Badge className="bg-green-100 text-green-800 border-none">
                                            Auto-Approved
                                        </Badge>
                                    )}
                                    {watchedValues.requires_dpa && (
                                        <Badge variant="outline">
                                            Requires DPA
                                        </Badge>
                                    )}
                                </div>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader className="pb-2">
                                <CardTitle className="text-sm">
                                    Risk & Compliance
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-1 text-sm">
                                <div>
                                    <strong>Risk Level:</strong>{" "}
                                    <span className="capitalize">
                                        {watchedValues.risk_level}
                                    </span>
                                </div>
                                <div>
                                    <strong>Compliance:</strong>{" "}
                                    <span className="capitalize">
                                        {watchedValues.compliance_status?.replace(
                                            "_",
                                            " "
                                        )}
                                    </span>
                                </div>
                                {watchedValues.website && (
                                    <div>
                                        <strong>Website:</strong>{" "}
                                        {watchedValues.website}
                                    </div>
                                )}
                                {watchedValues.description && (
                                    <div>
                                        <strong>Description:</strong>{" "}
                                        {watchedValues.description}
                                    </div>
                                )}
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader className="pb-2">
                                <CardTitle className="text-sm">
                                    Data & Certifications
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-2 text-sm">
                                <div>
                                    <strong>Data Subjects:</strong>{" "}
                                    {watchedValues.data_subjects?.length ? (
                                        <span className="flex flex-wrap gap-1 mt-1">
                                            {watchedValues.data_subjects.map(
                                                (s) => (
                                                    <Badge
                                                        key={s}
                                                        variant="secondary"
                                                        className="capitalize text-xs"
                                                    >
                                                        {s.replace(/_/g, " ")}
                                                    </Badge>
                                                )
                                            )}
                                        </span>
                                    ) : (
                                        "None"
                                    )}
                                </div>
                                <div>
                                    <strong>Certifications:</strong>{" "}
                                    {watchedValues.security_certifications
                                        ?.length ? (
                                        <span className="flex flex-wrap gap-1 mt-1">
                                            {watchedValues.security_certifications.map(
                                                (c) => (
                                                    <Badge
                                                        key={c}
                                                        variant="secondary"
                                                        className="text-xs"
                                                    >
                                                        {c}
                                                    </Badge>
                                                )
                                            )}
                                        </span>
                                    ) : (
                                        "None"
                                    )}
                                </div>
                                <div>
                                    <strong>Processing Locations:</strong>{" "}
                                    {watchedValues.processing_locations ||
                                        "None"}
                                </div>
                                <div>
                                    <strong>Sub-Processors:</strong>{" "}
                                    {watchedValues.sub_processors?.length || 0}
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                )}

                {/* ── Navigation ─────────────────────────────────── */}
                <div className="flex justify-between gap-2 pt-2">
                    <Button
                        type="button"
                        variant="outline"
                        onClick={handlePrevious}
                        disabled={currentStep === 0}
                    >
                        <ChevronLeft className="w-4 h-4 mr-1" /> Previous
                    </Button>
                    {currentStep < WIZARD_STEPS.length - 1 ? (
                        <Button type="button" onClick={handleNext}>
                            Next <ChevronRight className="w-4 h-4 ml-1" />
                        </Button>
                    ) : (
                        <Button
                            type="button"
                            onClick={handleFinalSubmit}
                            disabled={isLoading}
                        >
                            {isLoading
                                ? "Saving..."
                                : isEditing
                                ? "Update Vendor"
                                : "Create Vendor"}
                        </Button>
                    )}
                </div>
            </div>
        </Form>
    );
}
