import { useState } from "react";
import { type MetaFunction, useSearchParams } from "react-router";
import { useUsers, useRemoveUser } from "../features/settings/api/users";
import { type User } from "../features/settings/types/iam";
import { UserInviteSheet } from "../features/settings/components/UserInviteSheet";
import { EditUserSheet } from "../features/settings/components/EditUserSheet";
import { useRoles } from "../features/settings/api/roles";
import { type Role } from "../features/settings/types/iam";
import { RoleDetailsSheet } from "../features/settings/components/RoleDetailsSheet";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "~/components/ui/tabs";
import { Button } from "~/components/ui/button";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "~/components/ui/table";
import { Badge } from "~/components/ui/badge";
import { Input } from "~/components/ui/input";
import { Search, UserPlus, Mail, Trash2, Shield, Edit2 } from "lucide-react";
import { format } from "date-fns";

export const meta: MetaFunction = () => {
    return [
        { title: "Users & Access | ARC Admin" },
        { name: "description", content: "Manage users and access permissions." },
    ];
};

export default function UsersAndRolesPage() {
    const [searchParams, setSearchParams] = useSearchParams();
    const activeTab = searchParams.get("tab") || "users";

    const handleTabChange = (value: string) => {
        setSearchParams({ tab: value });
    };

    // --- Users State ---
    const { data: users, isLoading: usersLoading } = useUsers();
    const removeUserMutation = useRemoveUser();
    const [searchTerm, setSearchTerm] = useState("");
    const [isInviteOpen, setIsInviteOpen] = useState(false);
    const [editingUser, setEditingUser] = useState<User | null>(null);
    const [isEditUserOpen, setIsEditUserOpen] = useState(false);

    const safeUsers = Array.isArray(users) ? users : ((users as any)?.data || []);
    const filteredUsers = safeUsers.filter((u: User) =>
        u.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        u.role_name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const handleRemove = (id: string, email: string) => {
        if (confirm(`Are you sure you want to remove ${email} from this organization?`)) {
            removeUserMutation.mutate(id);
        }
    };

    const getRoleBadgeVariant = (roleName: string) => {
        const lower = roleName.toLowerCase();
        if (lower.includes("admin")) return "destructive";
        if (lower.includes("audit") || lower.includes("reviewer")) return "secondary";
        return "outline";
    };

    // --- Roles State ---
    const { data: rolesData, isLoading: rolesLoading } = useRoles();
    const roles = Array.isArray(rolesData) ? rolesData : ((rolesData as any)?.data || []);
    const [selectedRole, setSelectedRole] = useState<Role | undefined>(undefined);
    const [isRoleSheetOpen, setIsRoleSheetOpen] = useState(false);

    const handleRoleRowClick = (role: Role) => {
        setSelectedRole(role);
        setIsRoleSheetOpen(true);
    };

    return (
        <div className="p-8 max-w-7xl mx-auto space-y-6">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">Users & Roles</h1>
                <p className="text-muted-foreground mt-1 text-sm">
                    Manage user access, invite new members, and configure roles within your organization.
                </p>
            </div>

            <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
                <TabsList className="mb-4">
                    <TabsTrigger value="users">Users</TabsTrigger>
                    <TabsTrigger value="roles">Roles</TabsTrigger>
                </TabsList>

                <TabsContent value="users" className="space-y-4">
                    <div className="flex justify-between items-center mb-4">
                        <div className="flex items-center space-x-2 w-full max-w-sm">
                            <Search className="w-4 h-4 text-muted-foreground absolute ml-3" />
                            <Input
                                placeholder="Search by email or role..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="pl-9"
                            />
                        </div>
                        <Button onClick={() => setIsInviteOpen(true)}>
                            <UserPlus className="mr-2 h-4 w-4" /> Invite User
                        </Button>
                    </div>

                    <div className="rounded-md border bg-card">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>User</TableHead>
                                    <TableHead>Role</TableHead>
                                    <TableHead>Joined Date</TableHead>
                                    <TableHead className="text-right">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {usersLoading ? (
                                    <TableRow>
                                        <TableCell colSpan={4} className="h-24 text-center">Loading users...</TableCell>
                                    </TableRow>
                                ) : filteredUsers.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={4} className="h-24 text-center">No users found.</TableCell>
                                    </TableRow>
                                ) : (
                                    (filteredUsers || []).map((user: User) => (
                                        <TableRow key={user.id} className="hover:bg-muted/50">
                                            <TableCell className="font-medium">
                                                <div className="flex items-center gap-2">
                                                    <Mail className="h-4 w-4 text-muted-foreground" />
                                                    {user.email}
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <Badge variant={getRoleBadgeVariant(user.role_name)} className="capitalize">
                                                    {user.role_name}
                                                </Badge>
                                            </TableCell>
                                            <TableCell className="text-muted-foreground text-sm">
                                                {format(new Date(user.created_at), "MMM d, yyyy")}
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <div className="flex justify-end gap-2">
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        onClick={() => {
                                                            setEditingUser(user);
                                                            setIsEditUserOpen(true);
                                                        }}
                                                    >
                                                        <Edit2 className="h-4 w-4 text-muted-foreground" />
                                                    </Button>
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        className="text-destructive hover:text-destructive hover:bg-destructive/10"
                                                        onClick={() => handleRemove(user.id, user.email)}
                                                        disabled={removeUserMutation.isPending}
                                                    >
                                                        <Trash2 className="h-4 w-4" />
                                                    </Button>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    </div>
                </TabsContent>

                <TabsContent value="roles" className="space-y-4">
                    <div className="rounded-md border bg-card mt-4">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Role Name</TableHead>
                                    <TableHead>Total Permissions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {rolesLoading ? (
                                    <TableRow>
                                        <TableCell colSpan={2} className="h-24 text-center">Loading roles...</TableCell>
                                    </TableRow>
                                ) : roles.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={2} className="h-24 text-center">No roles found.</TableCell>
                                    </TableRow>
                                ) : (
                                    (roles || []).map((role: Role) => (
                                        <TableRow
                                            key={role.id}
                                            className="cursor-pointer hover:bg-muted/50"
                                            onClick={() => handleRoleRowClick(role)}
                                        >
                                            <TableCell className="font-medium">
                                                <div className="flex items-center gap-2">
                                                    <Shield className="h-4 w-4 text-primary" />
                                                    <span className="capitalize">{role.name}</span>
                                                </div>
                                            </TableCell>
                                            <TableCell className="text-muted-foreground">
                                                {role.permissions?.length || 0} permissions
                                            </TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    </div>
                </TabsContent>
            </Tabs>

            <UserInviteSheet
                open={isInviteOpen}
                onOpenChange={setIsInviteOpen}
            />

            <EditUserSheet
                open={isEditUserOpen}
                onOpenChange={setIsEditUserOpen}
                user={editingUser}
            />

            <RoleDetailsSheet
                role={selectedRole}
                open={isRoleSheetOpen}
                onOpenChange={setIsRoleSheetOpen}
            />
        </div>
    );
}
