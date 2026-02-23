import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRoles } from "../api/roles";
import { useUpdateUserRole } from "../api/users";
import type { User } from "../types/iam";
import { Button } from "~/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "~/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "~/components/ui/select";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "~/components/ui/sheet";
import { Loader2 } from "lucide-react";

interface EditUserSheetProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    user: User | null;
}

const editUserSchema = z.object({
    role_id: z.string().uuid("Please select a valid role."),
});

type EditUserData = z.infer<typeof editUserSchema>;

export function EditUserSheet({ open, onOpenChange, user }: EditUserSheetProps) {
    const { data: roles, isLoading: isRolesLoading } = useRoles();
    const updateMutation = useUpdateUserRole();

    const form = useForm<EditUserData>({
        resolver: zodResolver(editUserSchema),
        defaultValues: { role_id: "" },
    });

    useEffect(() => {
        if (open && user) {
            form.reset({ role_id: user.role_id });
        }
    }, [open, user, form]);

    const onSubmit = (data: EditUserData) => {
        if (!user) return;
        updateMutation.mutate(
            { id: user.id, roleId: data.role_id },
            {
                onSuccess: () => {
                    onOpenChange(false);
                },
            }
        );
    };

    return (
        <Sheet open={open} onOpenChange={onOpenChange}>
            <SheetContent>
                <SheetHeader className="mb-6">
                    <SheetTitle>Edit User Role</SheetTitle>
                    <SheetDescription>
                        Update the role assignment for {user?.email}.
                    </SheetDescription>
                </SheetHeader>

                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 px-6 pb-6">
                        <FormField
                            control={form.control}
                            name="role_id"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Role</FormLabel>
                                    <Select onValueChange={field.onChange} value={field.value}>
                                        <FormControl>
                                            <SelectTrigger>
                                                <SelectValue
                                                    placeholder={isRolesLoading ? "Loading roles..." : "Select a role"}
                                                />
                                            </SelectTrigger>
                                        </FormControl>
                                        <SelectContent>
                                            {roles?.map((role) => (
                                                <SelectItem key={role.id} value={role.id}>
                                                    {role.name}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <Button type="submit" disabled={updateMutation.isPending} className="w-full">
                            {updateMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Save Changes
                        </Button>
                    </form>
                </Form>
            </SheetContent>
        </Sheet>
    );
}
