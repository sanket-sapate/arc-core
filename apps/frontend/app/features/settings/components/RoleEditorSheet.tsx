import { useEffect, useMemo } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { createRoleSchema, type CreateRoleData, type Role, type Permission } from "../types/iam";
import { usePermissions, useCreateRole, useUpdateRole } from "../api/roles";
import { toast } from "sonner";
import { Input } from "~/components/ui/input";
import { Button } from "~/components/ui/button";
import { Textarea } from "~/components/ui/textarea";
import { Checkbox } from "~/components/ui/checkbox";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "~/components/ui/form";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "~/components/ui/sheet";
import { Loader2 } from "lucide-react";

const RESOURCE_LABELS: Record<string, string> = {
    vendors: "Vendors",
    frameworks: "Assessment Frameworks",
    assessments: "Vendor Assessments",
    dpas: "Data Processing Agreements",
    audit_cycles: "Audit Cycles",
    consents: "Consent Management",
    script_blocking: "Script Blocking",
    ropa: "Records of Processing",
    dpia: "Impact Assessments",
    dsr: "Data Subject Requests",
    breaches: "Data Breaches",
    discovery: "Data Discovery",
    sources: "Data Sources",
    dictionary: "Data Dictionary",
    cookie_scanner: "Cookie Scanner",
    users: "User Management",
    roles: "Role Management",
    api_keys: "API Keys",
    integrations: "Integrations",
    audit_logs: "Audit Logs",
};

const CRUD_ACTIONS = [
    { key: "create", label: "Create" },
    { key: "read", label: "Read" },
    { key: "update", label: "Update" },
    { key: "delete", label: "Delete" },
];

interface RoleEditorSheetProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    initialData?: Role | null;
}

export function RoleEditorSheet({ open, onOpenChange, initialData }: RoleEditorSheetProps) {
    const { data: permissions } = usePermissions();
    const createMutation = useCreateRole();
    const updateMutation = useUpdateRole();

    const isEditing = !!initialData;

    const form = useForm<CreateRoleData>({
        resolver: zodResolver(createRoleSchema),
        defaultValues: {
            name: "",
            description: "",
            permission_ids: [],
        },
    });

    useEffect(() => {
        if (open) {
            if (initialData) {
                const permissions = initialData.permissions || [];
                form.reset({
                    name: initialData.name,
                    description: initialData.description || "",
                    permission_ids: permissions,
                });
            } else {
                form.reset({
                    name: "",
                    description: "",
                    permission_ids: [],
                });
            }
        }
    }, [open, initialData, form]);

    const permissionsByResource = useMemo(() => {
        if (!permissions) return {};
        
        // Group permissions by resource (e.g., "vendors", "frameworks")
        const grouped: Record<string, Record<string, Permission>> = {};
        
        permissions.forEach((p) => {
            // Parse slug format: "resource.action" (e.g., "vendors.create")
            const parts = p.slug.split(".");
            if (parts.length === 2) {
                const [resource, action] = parts;
                if (!grouped[resource]) {
                    grouped[resource] = {};
                }
                grouped[resource][action] = p;
            }
        });
        
        return grouped;
    }, [permissions]);

    const toggleResource = (resourcePerms: Record<string, Permission>, checked: boolean) => {
        const current = form.getValues("permission_ids") || [];
        const permSlugs = Object.values(resourcePerms).map((p) => p.slug);
        if (checked) {
            const merged = Array.from(new Set([...current, ...permSlugs]));
            form.setValue("permission_ids", merged, { shouldDirty: true });
        } else {
            form.setValue(
                "permission_ids",
                current.filter((s) => !permSlugs.includes(s)),
                { shouldDirty: true }
            );
        }
    };

    const isResourceFullyChecked = (resourcePerms: Record<string, Permission>) => {
        const current = form.watch("permission_ids") || [];
        return Object.values(resourcePerms).every((p) => current.includes(p.slug));
    };

    const getResourceCheckCount = (resourcePerms: Record<string, Permission>) => {
        const current = form.watch("permission_ids") || [];
        return Object.values(resourcePerms).filter((p) => current.includes(p.slug)).length;
    };

    const onSubmit = (data: CreateRoleData) => {
        if (isEditing && initialData) {
            updateMutation.mutate(
                { id: initialData.id, payload: data },
                {
                    onSuccess: () => {
                        toast.success(`Role "${data.name}" updated successfully`);
                        onOpenChange(false);
                    },
                    onError: (err) => {
                        toast.error(err.message || "Failed to update role");
                    },
                }
            );
        } else {
            createMutation.mutate(data, {
                onSuccess: () => {
                    toast.success(`Role "${data.name}" created successfully`);
                    onOpenChange(false);
                },
                onError: (err) => {
                    toast.error(err.message || "Failed to create role");
                },
            });
        }
    };

    const isPending = createMutation.isPending || updateMutation.isPending;

    return (
        <Sheet key={initialData?.id || 'new'} open={open} onOpenChange={onOpenChange}>
            <SheetContent className="w-full sm:max-w-lg overflow-y-auto">
                <SheetHeader className="mb-6">
                    <SheetTitle>{isEditing ? "Edit Role" : "Create Custom Role"}</SheetTitle>
                    <SheetDescription>
                        {isEditing
                            ? "Modify the permissions and details for this role."
                            : "Define a new custom role and assign specific permissions."}
                    </SheetDescription>
                </SheetHeader>

                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 px-6 pb-6">
                        <FormField
                            control={form.control}
                            name="name"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Role Name</FormLabel>
                                    <FormControl>
                                        <Input placeholder="e.g. Data Steward" {...field} />
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
                                            placeholder="What does this role do?"
                                            className="resize-none"
                                            {...field}
                                        />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <div className="space-y-4">
                            <h3 className="text-sm font-medium">Permissions Matrix</h3>
                            <p className="text-xs text-muted-foreground">
                                Grant granular CRUD permissions for each resource
                            </p>
                            <div className="rounded-md border bg-muted/20">
                                <div className="max-h-[500px] overflow-y-auto">
                                    <table key={initialData?.id || 'new'} className="w-full">
                                        <thead className="sticky top-0 bg-muted/50 border-b">
                                            <tr>
                                                <th className="text-left p-3 text-xs font-semibold text-muted-foreground">
                                                    Resource
                                                </th>
                                                {CRUD_ACTIONS.map((action) => (
                                                    <th key={action.key} className="text-center p-3 text-xs font-semibold text-muted-foreground">
                                                        {action.label}
                                                    </th>
                                                ))}
                                                <th className="text-center p-3 text-xs font-semibold text-muted-foreground">
                                                    All
                                                </th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {Object.entries(permissionsByResource).map(([resource, actions]) => {
                                                const checkCount = getResourceCheckCount(actions);
                                                const totalCount = Object.keys(actions).length;
                                                const isFullyChecked = isResourceFullyChecked(actions);
                                                
                                                return (
                                                    <tr key={resource} className="border-b last:border-0 hover:bg-muted/30">
                                                        <td className="p-3 text-sm font-medium">
                                                            {RESOURCE_LABELS[resource] || resource}
                                                            {checkCount > 0 && checkCount < totalCount && (
                                                                <span className="ml-2 text-xs text-muted-foreground">
                                                                    ({checkCount}/{totalCount})
                                                                </span>
                                                            )}
                                                        </td>
                                                        {CRUD_ACTIONS.map((action) => {
                                                            const perm = actions[action.key];
                                                            if (!perm) {
                                                                return <td key={action.key} className="text-center p-3">-</td>;
                                                            }
                                                            return (
                                                                <td key={action.key} className="text-center p-3">
                                                                    <FormField
                                                                        control={form.control}
                                                                        name="permission_ids"
                                                                        render={({ field }) => (
                                                                            <FormItem>
                                                                                <FormControl>
                                                                                    <Checkbox
                                                                                        checked={field.value?.includes(perm.slug) || false}
                                                                                        onCheckedChange={(checked) => {
                                                                                            const current = field.value || [];
                                                                                            if (checked) {
                                                                                                field.onChange([...current, perm.slug]);
                                                                                            } else {
                                                                                                field.onChange(current.filter((value) => value !== perm.slug));
                                                                                            }
                                                                                        }}
                                                                                    />
                                                                                </FormControl>
                                                                            </FormItem>
                                                                        )}
                                                                    />
                                                                </td>
                                                            );
                                                        })}
                                                        <td className="text-center p-3">
                                                            <Checkbox
                                                                checked={isFullyChecked}
                                                                onCheckedChange={(checked) => {
                                                                    toggleResource(actions, checked === true);
                                                                }}
                                                            />
                                                        </td>
                                                    </tr>
                                                );
                                            })}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>

                        <Button type="submit" disabled={isPending} className="w-full">
                            {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            {isEditing ? "Save Changes" : "Create Role"}
                        </Button>
                    </form>
                </Form>
            </SheetContent>
        </Sheet>
    );
}
