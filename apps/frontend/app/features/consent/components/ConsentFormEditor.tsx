import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { consentFormSchema, type ConsentForm } from "../types/consent-form";
import { usePurposes } from "../api/purposes";
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
import { Badge } from "~/components/ui/badge";
import { Checkbox } from "~/components/ui/checkbox";
import { Skeleton } from "~/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "~/components/ui/tabs";
import { Copy, Check } from "lucide-react";

interface ConsentFormEditorProps {
    initialData?: ConsentForm;
    onSubmit: (data: ConsentForm) => void;
    isLoading?: boolean;
}

export function ConsentFormEditor({ initialData, onSubmit, isLoading }: ConsentFormEditorProps) {
    const { data: purposes, isLoading: isPurposesLoading } = usePurposes();
    const [copied, setCopied] = useState(false);

    const form = useForm<ConsentForm>({
        resolver: zodResolver(consentFormSchema) as any,
        defaultValues: {
            ...initialData,
            name: initialData?.name || "",
            description: initialData?.description || "",
            active: initialData?.active ?? true,
            purpose_ids: initialData?.purpose_ids || [],
        },
    });

    const integrationSnippet = `<script src="https://cdn.arc-grc.com/widget.js?formId=${initialData?.id || 'save-to-generate-id'}"></script>`;

    const handleCopy = () => {
        navigator.clipboard.writeText(integrationSnippet);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <Tabs defaultValue="settings" className="w-full">
                    <TabsList className="grid w-full grid-cols-3">
                        <TabsTrigger value="settings">Settings</TabsTrigger>
                        <TabsTrigger value="purposes">Purposes</TabsTrigger>
                        <TabsTrigger value="integration">Integration</TabsTrigger>
                    </TabsList>

                    <TabsContent value="settings" className="space-y-6 pt-4">
                        <FormField
                            control={form.control}
                            name="name"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Name</FormLabel>
                                    <FormControl>
                                        <Input placeholder="e.g. Default Newsletter Form" {...field} />
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
                                            placeholder="Describe what this consent form is used for..."
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
                            name="active"
                            render={({ field }) => (
                                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                                    <div className="space-y-0.5">
                                        <FormLabel className="text-base">Active Status</FormLabel>
                                        <FormDescription>
                                            Whether this consent form is currently active and usable.
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
                    </TabsContent>

                    <TabsContent value="purposes" className="space-y-4 pt-4">
                        <div className="rounded-lg border p-4">
                            <div className="space-y-0.5">
                                <FormLabel className="text-base">Linked Purposes</FormLabel>
                                <FormDescription>
                                    Select the processing purposes associated with this consent form.
                                </FormDescription>
                            </div>

                            <FormField
                                control={form.control}
                                name="purpose_ids"
                                render={() => (
                                    <FormItem>
                                        <div className="flex flex-col gap-3 mt-4">
                                            {isPurposesLoading ? (
                                                <div className="space-y-2">
                                                    <Skeleton className="h-10 w-full" />
                                                    <Skeleton className="h-10 w-full" />
                                                </div>
                                            ) : purposes?.length === 0 ? (
                                                <div className="text-sm text-muted-foreground p-3 bg-muted/50 rounded-md">
                                                    No active purposes available. Please create purposes first.
                                                </div>
                                            ) : (
                                                purposes?.filter(p => p.active)?.map((purpose) => (
                                                    <FormField
                                                        key={purpose.id}
                                                        control={form.control}
                                                        name="purpose_ids"
                                                        render={({ field }) => {
                                                            return (
                                                                <FormItem
                                                                    key={purpose.id}
                                                                    className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-3 shadow-sm hover:bg-muted/50 cursor-pointer"
                                                                >
                                                                    <FormControl>
                                                                        <Checkbox
                                                                            checked={field.value?.includes(purpose.id as string)}
                                                                            onCheckedChange={(checked: boolean | "indeterminate") => {
                                                                                return checked === true
                                                                                    ? field.onChange([...(field.value || []), purpose.id])
                                                                                    : field.onChange(
                                                                                        field.value?.filter(
                                                                                            (value) => value !== purpose.id
                                                                                        )
                                                                                    )
                                                                            }}
                                                                        />
                                                                    </FormControl>
                                                                    <div className="space-y-1 leading-none flex-1">
                                                                        <FormLabel className="font-medium cursor-pointer">
                                                                            {purpose.name}
                                                                        </FormLabel>
                                                                        <FormDescription className="line-clamp-2 text-xs">
                                                                            {purpose.description || `Legal Basis: ${purpose.legal_basis.replace('_', ' ')}`}
                                                                        </FormDescription>
                                                                    </div>
                                                                    {field.value?.includes(purpose.id as string) && (
                                                                        <Badge variant="secondary" className="ml-auto">Selected</Badge>
                                                                    )}
                                                                </FormItem>
                                                            )
                                                        }}
                                                    />
                                                ))
                                            )}
                                        </div>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>
                    </TabsContent>

                    <TabsContent value="integration" className="space-y-4 pt-4">
                        <div className="rounded-lg border p-6 space-y-4 bg-card">
                            <h3 className="text-lg font-medium">Embed Widget</h3>
                            <p className="text-sm text-muted-foreground">
                                Copy and paste this script tag into the <code className="bg-muted px-1.5 py-0.5 rounded text-xs">&lt;head&gt;</code> of your website to display the consent form.
                            </p>

                            <div className="relative group mt-4">
                                <pre className="bg-muted p-4 rounded-md overflow-x-auto text-sm font-mono border text-foreground">
                                    <code>{integrationSnippet}</code>
                                </pre>
                                <Button
                                    type="button"
                                    size="sm"
                                    variant="secondary"
                                    className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
                                    onClick={handleCopy}
                                    title="Copy script"
                                >
                                    {copied ? <Check className="h-4 w-4 text-emerald-500" /> : <Copy className="h-4 w-4 text-muted-foreground" />}
                                    <span className="sr-only">Copy</span>
                                </Button>
                            </div>

                            {!initialData?.id && (
                                <p className="text-xs text-amber-600 dark:text-amber-400 mt-2">
                                    Note: You must save this consent form first to generate a valid form ID for the integration script.
                                </p>
                            )}
                        </div>
                    </TabsContent>
                </Tabs>

                <div className="pt-2">
                    <Button type="submit" className="w-full" disabled={isLoading}>
                        {isLoading ? "Saving..." : initialData ? "Save Changes" : "Create Form"}
                    </Button>
                </div>
            </form>
        </Form>
    );
}
