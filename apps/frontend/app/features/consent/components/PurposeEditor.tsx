import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { purposeSchema, type Purpose } from "../types/purpose";
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

interface PurposeEditorProps {
    initialData?: Purpose;
    onSubmit: (data: Purpose) => void;
    isLoading?: boolean;
}

export function PurposeEditor({ initialData, onSubmit, isLoading }: PurposeEditorProps) {
    const form = useForm<Purpose>({
        resolver: zodResolver(purposeSchema) as any,
        defaultValues: {
            ...initialData,
            name: initialData?.name || "",
            description: initialData?.description || "",
            legal_basis: initialData?.legal_basis || "consent",
            active: initialData?.active ?? true,
        },
    });

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Name</FormLabel>
                            <FormControl>
                                <Input placeholder="e.g. Marketing Analytics" {...field} />
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
                                    placeholder="Describe the purpose of this processing..."
                                    className="resize-none"
                                    {...field}
                                />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                <FormField
                    control={form.control}
                    name="legal_basis"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Legal Basis</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                                <FormControl>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select a legal basis" />
                                    </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                    <SelectItem value="consent">Consent</SelectItem>
                                    <SelectItem value="legitimate_interest">Legitimate Interest</SelectItem>
                                    <SelectItem value="contract">Contract</SelectItem>
                                    <SelectItem value="legal_obligation">Legal Obligation</SelectItem>
                                </SelectContent>
                            </Select>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                <FormField
                    control={form.control}
                    name="active"
                    render={({ field }) => (
                        <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                            <div className="space-y-0.5">
                                <FormLabel className="text-base">Active Status</FormLabel>
                                <FormDescription>
                                    Whether this purpose is currently active and can be linked to consent forms.
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

                <Button type="submit" className="w-full" disabled={isLoading}>
                    {isLoading ? "Saving..." : initialData ? "Save Changes" : "Create Purpose"}
                </Button>
            </form>
        </Form>
    );
}
