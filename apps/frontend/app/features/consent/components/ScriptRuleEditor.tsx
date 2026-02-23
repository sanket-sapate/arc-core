import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import { z } from "zod";

import { usePurposes } from "~/features/consent/api/purposes";
import { useCreateScriptRule, useUpdateScriptRule } from "~/features/consent/api/script-rules";
import { type ScriptRule, createScriptRuleSchema } from "~/features/consent/types/script-rule";

import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "~/components/ui/select";
import { Switch } from "~/components/ui/switch";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "~/components/ui/sheet";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from "~/components/ui/form";
import { toast } from "sonner";

interface ScriptRuleEditorProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    initialData?: ScriptRule | null;
}

export function ScriptRuleEditor({ open, onOpenChange, initialData }: ScriptRuleEditorProps) {
    const { data: purposes, isLoading: purpLoading } = usePurposes();
    const createRule = useCreateScriptRule();
    const updateRule = useUpdateScriptRule();

    const isEditMode = !!initialData;

    const form = useForm<z.infer<typeof createScriptRuleSchema>>({
        resolver: zodResolver(createScriptRuleSchema),
        defaultValues: {
            name: "",
            script_domain: "",
            rule_type: "contains",
            purpose_id: "",
            active: true,
        },
    });

    useEffect(() => {
        if (open) {
            if (initialData) {
                form.reset({
                    name: initialData.name,
                    script_domain: initialData.script_domain,
                    rule_type: initialData.rule_type,
                    purpose_id: initialData.purpose_id,
                    active: initialData.active,
                });
            } else {
                form.reset({
                    name: "",
                    script_domain: "",
                    rule_type: "contains",
                    purpose_id: "",
                    active: true,
                });
            }
        }
    }, [open, initialData, form]);

    const isPending = createRule.isPending || updateRule.isPending;

    const onSubmit = (values: z.infer<typeof createScriptRuleSchema>) => {
        if (isEditMode && initialData) {
            updateRule.mutate(
                { id: initialData.id, data: values },
                {
                    onSuccess: () => {
                        toast.success("Rule updated successfully");
                        onOpenChange(false);
                    },
                    onError: (err) => {
                        toast.error("Error updating rule", { description: err.message });
                    },
                }
            );
        } else {
            createRule.mutate(values, {
                onSuccess: () => {
                    toast.success("Rule created successfully");
                    onOpenChange(false);
                },
                onError: (err) => {
                    toast.error("Error creating rule", { description: err.message });
                },
            });
        }
    };

    return (
        <Sheet open={open} onOpenChange={onOpenChange}>
            <SheetContent className="sm:max-w-md overflow-y-auto">
                <SheetHeader>
                    <SheetTitle>{isEditMode ? "Edit Script Rule" : "Add Script Rule"}</SheetTitle>
                    <SheetDescription>
                        Define a new script blocking rule to control third-party scripts.
                    </SheetDescription>
                </SheetHeader>

                <div className="px-6 pb-6">
                    <Form {...form}>
                        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                            <FormField
                                control={form.control}
                                name="name"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Rule Name</FormLabel>
                                        <FormControl>
                                            <Input placeholder="Google Analytics" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name="script_domain"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Script URL / Pattern</FormLabel>
                                        <FormControl>
                                            <Input placeholder="*google-analytics.com*" {...field} />
                                        </FormControl>
                                        <FormDescription>The URL token to match against injected scripts.</FormDescription>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name="rule_type"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Rule Match Type</FormLabel>
                                        <Select onValueChange={field.onChange} defaultValue={field.value} value={field.value}>
                                            <FormControl>
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Select type" />
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent>
                                                <SelectItem value="contains">Contains</SelectItem>
                                                <SelectItem value="exact">Exact Match</SelectItem>
                                                <SelectItem value="regex">Regex</SelectItem>
                                            </SelectContent>
                                        </Select>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name="purpose_id"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Consent Category / Purpose</FormLabel>
                                        <Select onValueChange={field.onChange} value={field.value ?? ""}>
                                            <FormControl>
                                                <SelectTrigger disabled={purpLoading}>
                                                    <SelectValue placeholder={purpLoading ? "Loading..." : "Select category"} />
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent>
                                                {purposes?.map((p) => (
                                                    <SelectItem key={p.id} value={p.id}>
                                                        {p.name}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                        <FormDescription>The script will only load if the user consents to this purpose.</FormDescription>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name="active"
                                render={({ field }) => (
                                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4 shadow-sm">
                                        <div className="space-y-0.5">
                                            <FormLabel className="text-base">Active Rule</FormLabel>
                                            <FormDescription>
                                                If inactive, this rule won't block scripts.
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

                            <Button type="submit" className="w-full" disabled={isPending}>
                                {isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : (isEditMode ? "Update Rule" : "Create Rule")}
                            </Button>
                        </form>
                    </Form>
                </div>
            </SheetContent>
        </Sheet>
    );
}
