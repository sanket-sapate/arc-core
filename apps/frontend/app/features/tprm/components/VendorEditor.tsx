import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { vendorSchema, type Vendor } from "../types/vendor";
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
import { Switch } from "~/components/ui/switch";
import { Button } from "~/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "~/components/ui/select";
import { Checkbox } from "~/components/ui/checkbox";

interface VendorEditorProps {
    initialData?: Vendor;
    onSubmit: (data: Vendor) => void;
    isLoading?: boolean;
}

export function VendorEditor({ initialData, onSubmit, isLoading }: VendorEditorProps) {
    const form = useForm<Vendor>({
        resolver: zodResolver(vendorSchema) as any,
        defaultValues: {
            ...initialData,
            name: initialData?.name || "",
            website: initialData?.website || "",
            description: initialData?.description || "",
            risk_level: initialData?.risk_level || "medium",
            compliance_status: initialData?.compliance_status || "under_review",
            active: initialData?.active ?? true,
        },
    });

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">

                <div className="space-y-4 rounded-lg border p-4">
                    <h3 className="font-semibold text-sm">Vendor Profile</h3>

                    <FormField
                        control={form.control}
                        name="name"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Name</FormLabel>
                                <FormControl>
                                    <Input placeholder="e.g. Acme Corporation" {...field} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />

                    <FormField
                        control={form.control}
                        name="website"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Website URI</FormLabel>
                                <FormControl>
                                    <Input type="url" placeholder="https://example.com" {...field} />
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

                <div className="space-y-4 rounded-lg border p-4">
                    <h3 className="font-semibold text-sm">Status & Compliance</h3>

                    <div className="grid grid-cols-2 gap-4">
                        <FormField
                            control={form.control}
                            name="risk_level"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Risk Level</FormLabel>
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
                            control={form.control}
                            name="compliance_status"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Compliance</FormLabel>
                                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                                        <FormControl>
                                            <SelectTrigger>
                                                <SelectValue placeholder="Select status" />
                                            </SelectTrigger>
                                        </FormControl>
                                        <SelectContent>
                                            <SelectItem value="compliant">Compliant</SelectItem>
                                            <SelectItem value="under_review">Under Review</SelectItem>
                                            <SelectItem value="non_compliant">Non-Compliant</SelectItem>
                                        </SelectContent>
                                    </Select>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4 mt-6">
                        <FormField
                            control={form.control}
                            name="requires_dpa"
                            render={({ field }) => (
                                <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4 shadow-sm bg-muted/10">
                                    <FormControl>
                                        <Checkbox
                                            checked={field.value}
                                            onCheckedChange={field.onChange}
                                        />
                                    </FormControl>
                                    <div className="space-y-1 leading-none">
                                        <FormLabel className="cursor-pointer">
                                            Require DPA
                                        </FormLabel>
                                        <FormDescription className="text-xs">
                                            Initiate a Data Processing Agreement.
                                        </FormDescription>
                                    </div>
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="requires_assessment"
                            render={({ field }) => (
                                <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4 shadow-sm bg-muted/10">
                                    <FormControl>
                                        <Checkbox
                                            checked={field.value}
                                            onCheckedChange={field.onChange}
                                        />
                                    </FormControl>
                                    <div className="space-y-1 leading-none">
                                        <FormLabel className="cursor-pointer">
                                            Require Assessment
                                        </FormLabel>
                                        <FormDescription className="text-xs">
                                            Trigger a security review assessment.
                                        </FormDescription>
                                    </div>
                                </FormItem>
                            )}
                        />
                    </div>

                    <FormField
                        control={form.control}
                        name="active"
                        render={({ field }) => (
                            <FormItem className="flex flex-row items-center justify-between rounded-lg border mt-4 p-4 bg-muted/30">
                                <div className="space-y-0.5">
                                    <FormLabel className="text-base">Active Vendor</FormLabel>
                                    <FormDescription>
                                        Is this vendor currently active within your environment?
                                    </FormDescription>
                                </div>
                                <FormControl>
                                    <Switch
                                        checked={field.value}
                                        onCheckedChange={field.onChange}
                                    />
                                </FormControl>
                            </FormItem>
                        )}
                    />
                </div>

                <Button type="submit" className="w-full" disabled={isLoading}>
                    {isLoading ? "Saving..." : initialData ? "Save Changes" : "Add Vendor"}
                </Button>
            </form>
        </Form>
    );
}
