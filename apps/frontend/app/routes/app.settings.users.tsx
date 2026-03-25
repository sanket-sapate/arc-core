import { useState } from "react";
import { useUsers, useRemoveUser } from "../features/settings/api/users";
import { type User } from "../features/settings/types/iam";
import { UserInviteSheet } from "../features/settings/components/UserInviteSheet";
import { EditUserSheet } from "../features/settings/components/EditUserSheet";
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
import { Search, UserPlus, Mail, ShieldAlert, Trash2, Edit } from "lucide-react";
import { format } from "date-fns";

export default function UsersPage() {
    const { data: users, isLoading } = useUsers();
    const removeUserMutation = useRemoveUser();
    const [searchTerm, setSearchTerm] = useState("");
    const [isInviteOpen, setIsInviteOpen] = useState(false);
    const [isEditUserOpen, setIsEditUserOpen] = useState(false);
    const [selectedUser, setSelectedUser] = useState<User | null>(null);

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

    const handleEditUser = (user: User) => {
        setSelectedUser(user);
        setIsEditUserOpen(true);
    };

    const getRoleBadgeVariant = (roleName: string) => {
        const lower = roleName.toLowerCase();
        if (lower.includes("admin")) return "destructive";
        if (lower.includes("audit") || lower.includes("reviewer")) return "secondary";
        return "outline";
    };

    return (
        <div className="p-8 max-w-7xl mx-auto space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Team Members</h1>
                    <p className="text-muted-foreground mt-1 text-sm">
                        Manage user access, invite new members, and assign roles within your organization.
                    </p>
                </div>
                <Button onClick={() => setIsInviteOpen(true)}>
                    <UserPlus className="mr-2 h-4 w-4" /> Invite User
                </Button>
            </div>

            <div className="flex items-center space-x-2 w-full max-w-sm">
                <Search className="w-4 h-4 text-muted-foreground absolute ml-3" />
                <Input
                    placeholder="Search by email or role..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-9"
                />
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
                        {isLoading ? (
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
                                    <TableCell className="text-right flex items-center justify-end gap-2">
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            className="text-muted-foreground hover:text-foreground"
                                            onClick={() => handleEditUser(user)}
                                        >
                                            <Edit className="h-4 w-4 mr-2" />
                                            Edit Role
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
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </div>

            <UserInviteSheet
                open={isInviteOpen}
                onOpenChange={setIsInviteOpen}
            />

            <EditUserSheet
                open={isEditUserOpen}
                onOpenChange={setIsEditUserOpen}
                user={selectedUser}
            />
        </div>
    );
}
