import { useEffect } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { ropaSchema, type ROPA } from "../types/ropa";
import { z } from "zod";
import { useCreateROPA, useUpdateROPA } from "../api/ropas";
import { Input } from "~/components/ui/input";
import { Button } from "~/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "~/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "~/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "~/components/ui/tabs";
import { Card, CardHeader, CardTitle, CardContent, CardDescription, CardFooter } from "~/components/ui/card";
import { Textarea } from "~/components/ui/textarea";
import { Loader2, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";

interface ROPAEditorProps {
    ropa?: ROPA;
    onClose: () => void;
}

export function ROPAEditor({ ropa, onClose }: ROPAEditorProps) {
    const createMutation = useCreateROPA();
    const updateMutation = useUpdateROPA();

    const isEditing = !!ropa;
    const isLoading = createMutation.isPending || updateMutation.isPending;

    const form = useForm<z.infer<typeof ropaSchema>>({
        resolver: zodResolver(ropaSchema) as any,
        defaultValues: {
            name: "",
            processing_activity: "",
            legal_basis: "Consent",
            status: "draft",
            data_categories: [""], // Start with one empty string
            ...(ropa || {}),
        },
    });

    const { fields, append, remove } = useFieldArray({
        control: form.control,
        name: "data_categories" as never, // cast due to useFieldArray typing quirk with primitives
    });

    // Reset form when `ropa` prop changes (e.g. switching selected ROPA in a sheet)
    useEffect(() => {
        if (ropa) {
            form.reset({
                ...ropa,
                // Ensure array has at least one item for the UI
                data_categories: ropa.data_categories?.length ? ropa.data_categories : [""],
            });
        } else {
            form.reset({
                name: "",
                processing_activity: "",
                legal_basis: "Consent",
                status: "draft",
                data_categories: [""],
            });
        }
    }, [ropa, form]);

    const onSubmit = async (values: z.infer<typeof ropaSchema>) => {
        // Filter out empty categories before saving
        const payload = {
            ...values,
            data_categories: values.data_categories.filter(c => c.trim() !== ""),
        };

        try {
            if (isEditing && ropa.id) {
                await updateMutation.mutateAsync({ id: ropa.id, payload });
                toast.success("ROPA record updated successfully");
            } else {
                await createMutation.mutateAsync(payload);
                toast.success("ROPA record created successfully");
            }
            onClose();
        } catch (error) {
            toast.error("Failed to save ROPA record");
        }
    };

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <Tabs defaultValue="general" className="w-full">
                    <TabsList className="grid w-full grid-cols-2">
                        <TabsTrigger value="general">Overview</TabsTrigger>
                        <TabsTrigger value="data">Data Elements</TabsTrigger>
                    </TabsList>

                    <TabsContent value="general" className="space-y-4 pt-4">
                        <FormField
                            control={form.control as any}
                            name="name"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Record Name</FormLabel>
                                    <FormControl>
                                        <Input placeholder="e.g. Employee Payroll Processing" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control as any}
                            name="processing_activity"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Processing Activity Description</FormLabel>
                                    <FormControl>
                                        <Textarea
                                            placeholder="Describe how and why the data is processed..."
                                            className="resize-none min-h-[100px]"
                                            {...field}
                                        />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <div className="grid grid-cols-2 gap-4">
                            <FormField
                                control={form.control as any}
                                name="legal_basis"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Legal Basis</FormLabel>
                                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                                            <FormControl>
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Select basis" />
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent>
                                                <SelectItem value="Consent">Consent</SelectItem>
                                                <SelectItem value="Contract">Contract</SelectItem>
                                                <SelectItem value="Legal Obligation">Legal Obligation</SelectItem>
                                                <SelectItem value="Vital Interests">Vital Interests</SelectItem>
                                                <SelectItem value="Public Task">Public Task</SelectItem>
                                                <SelectItem value="Legitimate Interests">Legitimate Interests</SelectItem>
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
                                        <FormLabel>Status</FormLabel>
                                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                                            <FormControl>
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Select status" />
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent>
                                                <SelectItem value="draft">Draft</SelectItem>
                                                <SelectItem value="active">Active</SelectItem>
                                                <SelectItem value="archived">Archived</SelectItem>
                                            </SelectContent>
                                        </Select>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>
                    </TabsContent>

                    <TabsContent value="data" className="space-y-4 pt-4">
                        <Card className="border-dashed shadow-none">
                            <CardHeader className="pb-3">
                                <CardTitle className="text-base">Data Categories Processed</CardTitle>
                                <CardDescription>List the specific types or categories of personal data involved in this activity.</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-3">
                                {fields.map((field, index) => (
                                    <FormField
                                        key={field.id}
                                        control={form.control as any}
                                        name={`data_categories.${index}`}
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormControl>
                                                    <div className="flex items-center space-x-2">
                                                        <Input placeholder="e.g. Financial Data, Health Records..." {...field} />
                                                        <Button
                                                            type="button"
                                                            variant="ghost"
                                                            size="icon"
                                                            onClick={() => remove(index)}
                                                            disabled={fields.length === 1}
                                                        >
                                                            <Trash2 className="h-4 w-4 text-destructive" />
                                                        </Button>
                                                    </div>
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                ))}
                            </CardContent>
                            <CardFooter>
                                <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    className="w-full border-dashed"
                                    onClick={() => append("")}
                                >
                                    <Plus className="mr-2 h-4 w-4" />
                                    Add Data Category
                                </Button>
                            </CardFooter>
                        </Card>
                    </TabsContent>
                </Tabs>

                <div className="flex justify-end space-x-2 pt-4 border-t">
                    <Button type="button" variant="outline" onClick={onClose} disabled={isLoading}>
                        Cancel
                    </Button>
                    <Button type="submit" disabled={isLoading}>
                        {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        {isEditing ? "Save Changes" : "Create Record"}
                    </Button>
                </div>
            </form>
        </Form>
    );
}
