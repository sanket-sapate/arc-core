import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { dpaSchema, type Dpa } from "../types/dpa";
import { useVendors } from "../api/vendors";
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "~/components/ui/select";
import { Skeleton } from "~/components/ui/skeleton";

interface DPAEditorProps {
    initialData?: Dpa;
    onSubmit: (data: Dpa) => void;
    isLoading?: boolean;
}

export function DPAEditor({ initialData, onSubmit, isLoading }: DPAEditorProps) {
    const { data: vendors, isLoading: isVendorsLoading } = useVendors();

    const form = useForm<Dpa>({
        resolver: zodResolver(dpaSchema) as any,
        defaultValues: {
            ...initialData,
            vendor_id: initialData?.vendor_id || "",
            status: initialData?.status || "draft",
            effective_date: initialData?.effective_date || "",
            notes: initialData?.notes || "",
        },
    });

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">

                <div className="space-y-4 rounded-lg border p-4">
                    <h3 className="font-semibold text-sm">Agreement Details</h3>

                    <FormField
                        control={form.control}
                        name="vendor_id"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Vendor / Processor</FormLabel>
                                <Select
                                    onValueChange={field.onChange}
                                    defaultValue={field.value}
                                    disabled={isVendorsLoading || !!initialData} // Lock if editing
                                >
                                    <FormControl>
                                        <SelectTrigger>
                                            {isVendorsLoading ? (
                                                <Skeleton className="h-4 w-[150px]" />
                                            ) : (
                                                <SelectValue placeholder="Select a connected vendor" />
                                            )}
                                        </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                        {vendors?.map((vendor) => (
                                            <SelectItem key={vendor.id} value={vendor.id!}>
                                                {vendor.name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                <FormMessage />
                            </FormItem>
                        )}
                    />

                    <div className="grid grid-cols-2 gap-4">
                        <FormField
                            control={form.control}
                            name="status"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Agreement Status</FormLabel>
                                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                                        <FormControl>
                                            <SelectTrigger>
                                                <SelectValue placeholder="Select status" />
                                            </SelectTrigger>
                                        </FormControl>
                                        <SelectContent>
                                            <SelectItem value="draft">Draft</SelectItem>
                                            <SelectItem value="sent">Sent for Signature</SelectItem>
                                            <SelectItem value="signed">Signed & Active</SelectItem>
                                            <SelectItem value="expired">Expired</SelectItem>
                                        </SelectContent>
                                    </Select>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="effective_date"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Effective Date</FormLabel>
                                    <FormControl>
                                        <Input type="date" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                    </div>

                    <FormField
                        control={form.control}
                        name="notes"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Notes / Comments</FormLabel>
                                <FormControl>
                                    <Textarea
                                        placeholder="Tracking IDs, negotiation comments, or renewal dates..."
                                        className="resize-none"
                                        {...field}
                                    />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                </div>

                <Button type="submit" className="w-full" disabled={isLoading}>
                    {isLoading ? "Saving..." : initialData ? "Save Changes" : "Create Agreement"}
                </Button>
            </form>
        </Form>
    );
}
