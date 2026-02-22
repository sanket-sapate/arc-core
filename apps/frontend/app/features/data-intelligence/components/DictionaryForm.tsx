import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
    dictionaryItemSchema,
    type DictionaryItemFormValues,
    type DictionaryItem,
} from "../types/dictionary";
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "~/components/ui/form";
import { Input } from "~/components/ui/input";
import { Button } from "~/components/ui/button";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "~/components/ui/select";
import { Switch } from "~/components/ui/switch";

// ── Props ──────────────────────────────────────────────────────────────────

interface DictionaryFormProps {
    initialData?: DictionaryItem;
    onSubmit: (values: DictionaryItemFormValues) => void;
    isPending?: boolean;
}

// ── Sensitivity options ────────────────────────────────────────────────────

const sensitivityOptions = [
    { value: "low", label: "Low" },
    { value: "medium", label: "Medium" },
    { value: "high", label: "High" },
    { value: "critical", label: "Critical" },
] as const;

// ── Component ──────────────────────────────────────────────────────────────

export function DictionaryForm({
    initialData,
    onSubmit,
    isPending,
}: DictionaryFormProps) {
    const form = useForm<DictionaryItemFormValues>({
        resolver: zodResolver(dictionaryItemSchema),
        defaultValues: {
            name: initialData?.name ?? "",
            category: initialData?.category ?? "",
            sensitivity: initialData?.sensitivity ?? "medium",
            active: initialData?.active ?? true,
        },
    });

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                {/* ── Name ──────────────────────────────────────────────────── */}
                <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Name</FormLabel>
                            <FormControl>
                                <Input placeholder="e.g. Social Security Number" {...field} />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                {/* ── Category ─────────────────────────────────────────────── */}
                <FormField
                    control={form.control}
                    name="category"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Category</FormLabel>
                            <FormControl>
                                <Input placeholder="e.g. PII, Financial, Health" {...field} />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                {/* ── Sensitivity ──────────────────────────────────────────── */}
                <FormField
                    control={form.control}
                    name="sensitivity"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Sensitivity Level</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                                <FormControl>
                                    <SelectTrigger className="w-full">
                                        <SelectValue placeholder="Select sensitivity" />
                                    </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                    {sensitivityOptions.map((opt) => (
                                        <SelectItem key={opt.value} value={opt.value}>
                                            {opt.label}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                {/* ── Active toggle ────────────────────────────────────────── */}
                <FormField
                    control={form.control}
                    name="active"
                    render={({ field }) => (
                        <FormItem className="flex items-center justify-between rounded-lg border p-4">
                            <div className="space-y-0.5">
                                <FormLabel className="text-sm font-medium">Active</FormLabel>
                                <p className="text-xs text-muted-foreground">
                                    Inactive items will be excluded from scans.
                                </p>
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

                {/* ── Submit ───────────────────────────────────────────────── */}
                <Button type="submit" className="w-full" disabled={isPending}>
                    {isPending
                        ? "Saving…"
                        : initialData
                            ? "Update Element"
                            : "Create Element"}
                </Button>
            </form>
        </Form>
    );
}
