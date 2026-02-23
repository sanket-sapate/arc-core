import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { createBreachSchema, type CreateBreachData, type Breach } from "../types/breach";
import { useCreateBreach, useUpdateBreach } from "../api/breaches";
import { Input } from "~/components/ui/input";
import { Button } from "~/components/ui/button";
import { Textarea } from "~/components/ui/textarea";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "~/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "~/components/ui/select";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "~/components/ui/sheet";
import { Loader2 } from "lucide-react";
import { format } from "date-fns";

interface BreachReporterSheetProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    initialData?: Breach | null;
}

export function BreachReporterSheet({ open, onOpenChange, initialData }: BreachReporterSheetProps) {
    const createMutation = useCreateBreach();
    const updateMutation = useUpdateBreach();

    const isEditing = !!initialData;

    const form = useForm<CreateBreachData>({
        resolver: zodResolver(createBreachSchema),
        defaultValues: {
            title: "",
            severity: "low",
            status: "investigating",
            incident_date: new Date().toISOString().split("T")[0],
            description: "",
            remediation_plan: "",
        },
    });

    useEffect(() => {
        if (open && initialData) {
            form.reset({
                title: initialData.title,
                severity: initialData.severity,
                status: initialData.status,
                incident_date: initialData.incident_date ? format(new Date(initialData.incident_date), "yyyy-MM-dd") : "",
                description: initialData.description || "",
                remediation_plan: initialData.remediation_plan || "",
            });
        } else if (open && !initialData) {
            form.reset({
                title: "",
                severity: "low",
                status: "investigating",
                incident_date: format(new Date(), "yyyy-MM-dd"),
                description: "",
                remediation_plan: "",
            });
        }
    }, [open, initialData, form]);

    const onSubmit = (data: CreateBreachData) => {
        // Ensure incident_date is a full ISO string if it's set
        const payload = { ...data };
        if (payload.incident_date) {
            payload.incident_date = new Date(payload.incident_date).toISOString();
        }

        if (isEditing && initialData) {
            updateMutation.mutate(
                { id: initialData.id, payload },
                { onSuccess: () => onOpenChange(false) }
            );
        } else {
            createMutation.mutate(payload, {
                onSuccess: () => onOpenChange(false),
            });
        }
    };

    const isPending = createMutation.isPending || updateMutation.isPending;

    return (
        <Sheet open={open} onOpenChange={onOpenChange}>
            <SheetContent className="w-full sm:max-w-xl overflow-y-auto">
                <SheetHeader className="mb-6">
                    <SheetTitle>{isEditing ? "Update Incident/Breach" : "Report Data Breach Workspace"}</SheetTitle>
                    <SheetDescription>
                        {isEditing
                            ? "Update the current status and remediation plan of this incident."
                            : "Log a new data privacy or security incident to track investigations."}
                    </SheetDescription>
                </SheetHeader>

                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 px-6 pb-6">
                        <FormField
                            control={form.control}
                            name="title"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Incident Title</FormLabel>
                                    <FormControl>
                                        <Input placeholder="e.g. Unauthorized S3 Bucket Access" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <div className="grid grid-cols-2 gap-4">
                            <FormField
                                control={form.control}
                                name="severity"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Severity</FormLabel>
                                        <Select onValueChange={field.onChange} value={field.value}>
                                            <FormControl>
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Select severity" />
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent>
                                                <SelectItem value="low">Low</SelectItem>
                                                <SelectItem value="medium">Medium</SelectItem>
                                                <SelectItem value="high">High</SelectItem>
                                                <SelectItem value="critical">Critical</SelectItem>
                                            </SelectContent>
                                        </Select>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name="status"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Status</FormLabel>
                                        <Select onValueChange={field.onChange} value={field.value}>
                                            <FormControl>
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Select status" />
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent>
                                                <SelectItem value="investigating">Investigating</SelectItem>
                                                <SelectItem value="contained">Contained</SelectItem>
                                                <SelectItem value="resolved">Resolved</SelectItem>
                                                <SelectItem value="closed">Closed</SelectItem>
                                            </SelectContent>
                                        </Select>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>

                        <FormField
                            control={form.control}
                            name="incident_date"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Incident Discovery Date</FormLabel>
                                    <FormControl>
                                        <Input type="date" {...field} />
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
                                    <FormLabel>Incident Description</FormLabel>
                                    <FormControl>
                                        <Textarea
                                            placeholder="Detail the scope and context of the incident..."
                                            className="min-h-[100px]"
                                            {...field}
                                        />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="remediation_plan"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Remediation Plan</FormLabel>
                                    <FormControl>
                                        <Textarea
                                            placeholder="Actions taken to mitigate and prevent recurrence..."
                                            className="min-h-[100px]"
                                            {...field}
                                        />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <Button type="submit" disabled={isPending} className="w-full">
                            {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            {isEditing ? "Save Changes" : "Create Report"}
                        </Button>
                    </form>
                </Form>
            </SheetContent>
        </Sheet>
    );
}
