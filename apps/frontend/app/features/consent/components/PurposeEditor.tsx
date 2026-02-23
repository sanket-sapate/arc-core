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
import { useDictionaryItems } from "~/features/data-intelligence/api/dictionary";
import { Checkbox } from "~/components/ui/checkbox";
import { ScrollArea } from "~/components/ui/scroll-area";

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
            data_objects: initialData?.data_objects || [],
        },
    });

    const dictionaryQuery = useDictionaryItems();
    const dictionaryItems = dictionaryQuery.data || [];

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
                    name="data_objects"
                    render={() => (
                        <FormItem>
                            <div className="mb-4">
                                <FormLabel className="text-base">Associated Data Objects</FormLabel>
                                <FormDescription>
                                    Select the data objects from the dictionary that are processed for this purpose.
                                </FormDescription>
                            </div>
                            <ScrollArea className="h-[200px] w-full rounded-md border p-4">
                                {dictionaryQuery.isLoading ? (
                                    <div className="text-sm text-muted-foreground">Loading data dictionary...</div>
                                ) : dictionaryItems.length === 0 ? (
                                    <div className="text-sm text-muted-foreground">No data objects found in the dictionary.</div>
                                ) : (
                                    <div className="space-y-4">
                                        {dictionaryItems.map((item) => (
                                            <FormField
                                                key={item.id}
                                                control={form.control}
                                                name="data_objects"
                                                render={({ field }) => {
                                                    const isChecked = field.value?.includes(item.id!) || false;
                                                    return (
                                                        <FormItem
                                                            key={item.id}
                                                            className="flex flex-row items-start space-x-3 space-y-0"
                                                        >
                                                            <FormControl>
                                                                <Checkbox
                                                                    checked={isChecked}
                                                                    onCheckedChange={(checked) => {
                                                                        const current = field.value || [];
                                                                        return checked
                                                                            ? field.onChange([...current, item.id!])
                                                                            : field.onChange(
                                                                                current.filter(
                                                                                    (value) => value !== item.id
                                                                                )
                                                                            )
                                                                    }}
                                                                />
                                                            </FormControl>
                                                            <div className="space-y-1 leading-none">
                                                                <FormLabel className="font-normal cursor-pointer">
                                                                    {item.name}
                                                                </FormLabel>
                                                                <FormDescription className="text-xs capitalize">
                                                                    {item.category} • {item.sensitivity}
                                                                </FormDescription>
                                                            </div>
                                                        </FormItem>
                                                    )
                                                }}
                                            />
                                        ))}
                                    </div>
                                )}
                            </ScrollArea>
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
