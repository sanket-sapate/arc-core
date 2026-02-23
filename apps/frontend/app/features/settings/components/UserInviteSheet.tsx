import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { inviteUserSchema, type InviteUserData } from "../types/iam";
import { useRoles } from "../api/roles";
import { useInviteUser } from "../api/users";
import { Input } from "~/components/ui/input";
import { Button } from "~/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "~/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "~/components/ui/select";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "~/components/ui/sheet";
import { Loader2 } from "lucide-react";

interface UserInviteSheetProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

export function UserInviteSheet({ open, onOpenChange }: UserInviteSheetProps) {
    const { data: roles, isLoading: isRolesLoading } = useRoles();
    const inviteMutation = useInviteUser();

    const form = useForm<InviteUserData>({
        resolver: zodResolver(inviteUserSchema),
        defaultValues: { email: "", role_id: "" },
    });

    const onSubmit = (data: InviteUserData) => {
        inviteMutation.mutate(data, {
            onSuccess: () => {
                form.reset();
                onOpenChange(false);
            },
        });
    };

    return (
        <Sheet open={open} onOpenChange={onOpenChange}>
            <SheetContent>
                <SheetHeader className="mb-6">
                    <SheetTitle>Invite Team Member</SheetTitle>
                    <SheetDescription>
                        Send an invitation to join your organization. Assign them an initial role.
                    </SheetDescription>
                </SheetHeader>

                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 px-6 pb-6">
                        <FormField
                            control={form.control}
                            name="email"
                            render={({ field }: { field: any }) => (
                                <FormItem>
                                    <FormLabel>Email Address</FormLabel>
                                    <FormControl>
                                        <Input placeholder="member@company.com" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="role_id"
                            render={({ field }: { field: any }) => (
                                <FormItem>
                                    <FormLabel>Role</FormLabel>
                                    <Select onValueChange={field.onChange} value={field.value}>
                                        <FormControl>
                                            <SelectTrigger>
                                                <SelectValue placeholder={isRolesLoading ? "Loading roles..." : "Select a role"} />
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

                        <Button type="submit" disabled={inviteMutation.isPending} className="w-full">
                            {inviteMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Send Invitation
                        </Button>
                    </form>
                </Form>
            </SheetContent>
        </Sheet>
    );
}
