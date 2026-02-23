import { useEffect, useMemo } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { createRoleSchema, type CreateRoleData, type Role, type Permission } from "../types/iam";
import { usePermissions, useCreateRole, useUpdateRole } from "../api/roles";
import { Input } from "~/components/ui/input";
import { Button } from "~/components/ui/button";
import { Textarea } from "~/components/ui/textarea";
import { Checkbox } from "~/components/ui/checkbox";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "~/components/ui/form";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "~/components/ui/sheet";
import { Loader2 } from "lucide-react";

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
                form.reset({
                    name: initialData.name,
                    description: initialData.description || "",
                    permission_ids: initialData.permissions || [],
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

    const permissionsByGroup = useMemo(() => {
        if (!permissions) return {};
        return permissions.reduce((acc, p) => {
            const groupName = p.slug.split(":")[0];
            if (!acc[groupName]) acc[groupName] = [];
            acc[groupName].push(p);
            return acc;
        }, {} as Record<string, Permission[]>);
    }, [permissions]);

    const onSubmit = (data: CreateRoleData) => {
        if (isEditing && initialData) {
            updateMutation.mutate(
                { id: initialData.id, payload: data },
                {
                    onSuccess: () => onOpenChange(false),
                }
            );
        } else {
            createMutation.mutate(data, {
                onSuccess: () => onOpenChange(false),
            });
        }
    };

    const isPending = createMutation.isPending || updateMutation.isPending;

    return (
        <Sheet open={open} onOpenChange={onOpenChange}>
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
                            <h3 className="text-sm font-medium">Permissions</h3>
                            <div className="rounded-md border p-4 space-y-6 bg-muted/20">
                                {Object.entries(permissionsByGroup).map(([group, perms]) => (
                                    <div key={group} className="space-y-2">
                                        <h4 className="text-xs font-semibold tracking-wider text-muted-foreground uppercase">
                                            {group} Module
                                        </h4>
                                        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                                            {perms.map((perm) => (
                                                <FormField
                                                    key={perm.slug}
                                                    control={form.control}
                                                    name="permission_ids"
                                                    render={({ field }) => {
                                                        const isChecked = field.value?.includes(perm.slug);
                                                        return (
                                                            <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                                                                <FormControl>
                                                                    <Checkbox
                                                                        checked={isChecked}
                                                                        onCheckedChange={(checked) => {
                                                                            return checked
                                                                                ? field.onChange([...field.value, perm.slug])
                                                                                : field.onChange(
                                                                                    field.value?.filter(
                                                                                        (value) => value !== perm.slug
                                                                                    )
                                                                                );
                                                                        }}
                                                                    />
                                                                </FormControl>
                                                                <div className="space-y-1 leading-none">
                                                                    <FormLabel className="text-sm font-normal cursor-pointer">
                                                                        {perm.name}
                                                                    </FormLabel>
                                                                </div>
                                                            </FormItem>
                                                        );
                                                    }}
                                                />
                                            ))}
                                        </div>
                                    </div>
                                ))}
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
