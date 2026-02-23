import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { dpiaSchema, type DPIA } from "../types/dpia";
import { z } from "zod";
import { useCreateDPIA, useUpdateDPIA } from "../api/dpias";
import { useVendors } from "../../tprm/api/vendors";
import { Input } from "~/components/ui/input";
import { Button } from "~/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from "~/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "~/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "~/components/ui/tabs";
import { Checkbox } from "~/components/ui/checkbox";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

interface DPIAEditorProps {
    dpia?: DPIA;
    onClose: () => void;
}

export function DPIAEditor({ dpia, onClose }: DPIAEditorProps) {
    const createMutation = useCreateDPIA();
    const updateMutation = useUpdateDPIA();
    const { data: vendors, isLoading: isLoadingVendors } = useVendors();

    const isEditing = !!dpia;
    const isLoading = createMutation.isPending || updateMutation.isPending;

    const form = useForm<z.infer<typeof dpiaSchema>>({
        resolver: zodResolver(dpiaSchema) as any,
        defaultValues: {
            name: "",
            status: "draft",
            risk_level: "medium",
            vendor_id: null,
            form_data: {
                has_sensitive_data: false,
                automated_decision_making: false,
                data_transfer_outside_eea: false,
                purpose_of_processing: "",
            },
            ...(dpia || {}),
        },
    });

    useEffect(() => {
        if (dpia) {
            form.reset({
                ...dpia,
                form_data: dpia.form_data || {
                    has_sensitive_data: false,
                    automated_decision_making: false,
                    data_transfer_outside_eea: false,
                    purpose_of_processing: "",
                }
            });
        }
    }, [dpia, form]);

    const onSubmit = async (values: z.infer<typeof dpiaSchema>) => {
        try {
            if (isEditing && dpia.id) {
                await updateMutation.mutateAsync({ id: dpia.id, payload: values });
                toast.success("DPIA updated successfully");
            } else {
                await createMutation.mutateAsync(values);
                toast.success("DPIA created successfully");
            }
            onClose();
        } catch (error) {
            toast.error("Failed to save DPIA");
        }
    };

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <Tabs defaultValue="overview" className="w-full">
                    <TabsList className="grid w-full grid-cols-2">
                        <TabsTrigger value="overview">Overview</TabsTrigger>
                        <TabsTrigger value="assessment">Risk Assessment</TabsTrigger>
                    </TabsList>

                    <TabsContent value="overview" className="space-y-4 pt-4">
                        <FormField
                            control={form.control as any}
                            name="name"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Project / Assessment Name</FormLabel>
                                    <FormControl>
                                        <Input placeholder="e.g. New HR System Migration" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control as any}
                            name="vendor_id"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Related Vendor (Optional)</FormLabel>
                                    <Select
                                        onValueChange={(v) => field.onChange(v === "none" ? null : v)}
                                        defaultValue={field.value || "none"}
                                        disabled={isLoadingVendors}
                                    >
                                        <FormControl>
                                            <SelectTrigger>
                                                <SelectValue placeholder="Select a vendor" />
                                            </SelectTrigger>
                                        </FormControl>
                                        <SelectContent>
                                            <SelectItem value="none">No Vendor (Internal Project)</SelectItem>
                                            {vendors?.map(v => (
                                                <SelectItem key={v.id} value={v.id!}>{v.name}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <div className="grid grid-cols-2 gap-4">
                            <FormField
                                control={form.control as any}
                                name="risk_level"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Initial Risk Level</FormLabel>
                                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                                            <FormControl>
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Select risk level" />
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent>
                                                <SelectItem value="low">Low Risk</SelectItem>
                                                <SelectItem value="medium">Medium Risk</SelectItem>
                                                <SelectItem value="high">High Risk</SelectItem>
                                                <SelectItem value="critical">Critical Risk</SelectItem>
                                            </SelectContent>
                                        </Select>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control as any}
                                name="status"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Assessment Status</FormLabel>
                                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                                            <FormControl>
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Select status" />
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent>
                                                <SelectItem value="draft">Draft</SelectItem>
                                                <SelectItem value="in_progress">In Progress</SelectItem>
                                                <SelectItem value="under_review">Under Review</SelectItem>
                                                <SelectItem value="approved">Approved</SelectItem>
                                                <SelectItem value="rejected">Rejected</SelectItem>
                                            </SelectContent>
                                        </Select>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>
                    </TabsContent>

                    <TabsContent value="assessment" className="space-y-4 pt-4">
                        <div className="space-y-4 rounded-md border p-4">
                            <FormField
                                control={form.control as any}
                                name="form_data.purpose_of_processing"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Purpose of Processing</FormLabel>
                                        <FormControl>
                                            <Input placeholder="Describe why this processing is necessary..." {...field} value={field.value || ""} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <div className="space-y-3 pt-3">
                                <h4 className="text-sm font-medium leading-none">High Risk Triggers</h4>
                                <FormField
                                    control={form.control as any}
                                    name="form_data.has_sensitive_data"
                                    render={({ field }) => (
                                        <FormItem className="flex flex-row items-start space-x-3 space-y-0 p-2 border rounded-md">
                                            <FormControl>
                                                <Checkbox checked={!!field.value} onCheckedChange={field.onChange} />
                                            </FormControl>
                                            <div className="space-y-1 leading-none">
                                                <FormLabel>Processing of Sensitive Data</FormLabel>
                                                <FormDescription>Includes special categories (health, biometric, racial origins)</FormDescription>
                                            </div>
                                        </FormItem>
                                    )}
                                />

                                <FormField
                                    control={form.control as any}
                                    name="form_data.automated_decision_making"
                                    render={({ field }) => (
                                        <FormItem className="flex flex-row items-start space-x-3 space-y-0 p-2 border rounded-md">
                                            <FormControl>
                                                <Checkbox checked={!!field.value} onCheckedChange={field.onChange} />
                                            </FormControl>
                                            <div className="space-y-1 leading-none">
                                                <FormLabel>Automated Decision Making / Profiling</FormLabel>
                                                <FormDescription>Systematic evaluation with legal effects on subjects</FormDescription>
                                            </div>
                                        </FormItem>
                                    )}
                                />

                                <FormField
                                    control={form.control as any}
                                    name="form_data.data_transfer_outside_eea"
                                    render={({ field }) => (
                                        <FormItem className="flex flex-row items-start space-x-3 space-y-0 p-2 border rounded-md">
                                            <FormControl>
                                                <Checkbox checked={!!field.value} onCheckedChange={field.onChange} />
                                            </FormControl>
                                            <div className="space-y-1 leading-none">
                                                <FormLabel>Cross-Border Transfers</FormLabel>
                                                <FormDescription>Transferring data outside the origin region (e.g., EEA to US)</FormDescription>
                                            </div>
                                        </FormItem>
                                    )}
                                />
                            </div>
                        </div>
                    </TabsContent>
                </Tabs>

                <div className="flex justify-end space-x-2 pt-4 border-t">
                    <Button type="button" variant="outline" onClick={onClose} disabled={isLoading}>
                        Cancel
                    </Button>
                    <Button type="submit" disabled={isLoading}>
                        {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        {isEditing ? "Save Changes" : "Create DPIA"}
                    </Button>
                </div>
            </form>
        </Form>
    );
}
