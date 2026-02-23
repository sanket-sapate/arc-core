import { useState } from "react";
import { useRoles } from "../features/settings/api/roles";
import { type Role } from "../features/settings/types/iam";
import { RoleDetailsSheet } from "../features/settings/components/RoleDetailsSheet";
import { RoleEditorSheet } from "../features/settings/components/RoleEditorSheet";
import { Button } from "~/components/ui/button";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "~/components/ui/table";
import { Shield, Plus, Edit } from "lucide-react";

export default function RolesPage() {
    const { data: rolesData, isLoading } = useRoles();
    const roles = Array.isArray(rolesData) ? rolesData : ((rolesData as any)?.data || []);

    const [selectedRole, setSelectedRole] = useState<Role | undefined>(undefined);
    const [isSheetOpen, setIsSheetOpen] = useState(false);
    const [isEditorOpen, setIsEditorOpen] = useState(false);

    const handleRowClick = (role: Role) => {
        setSelectedRole(role);
        setIsSheetOpen(true);
    };

    const handleEditClick = (e: React.MouseEvent, role: Role) => {
        e.stopPropagation();
        setSelectedRole(role);
        setIsEditorOpen(true);
    };

    return (
        <div className="p-8 max-w-7xl mx-auto space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Roles & Permissions</h1>
                    <p className="text-muted-foreground mt-1 text-sm">
                        Manage RBAC roles and view explicitly granted permissions within your organization.
                    </p>
                </div>
                <Button onClick={() => { setSelectedRole(undefined); setIsEditorOpen(true); }}>
                    <Plus className="mr-2 h-4 w-4" /> Create Custom Role
                </Button>
            </div>

            <div className="rounded-md border bg-card">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Role Name</TableHead>
                            <TableHead>Total Permissions</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {isLoading ? (
                            <TableRow>
                                <TableCell colSpan={3} className="h-24 text-center">Loading roles...</TableCell>
                            </TableRow>
                        ) : roles.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={3} className="h-24 text-center">No roles found.</TableCell>
                            </TableRow>
                        ) : (
                            (roles || []).map((role: Role) => (
                                <TableRow
                                    key={role.id}
                                    className="cursor-pointer hover:bg-muted/50"
                                    onClick={() => handleRowClick(role)}
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
                                    <TableCell className="text-right">
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            className="text-muted-foreground hover:text-foreground"
                                            onClick={(e) => handleEditClick(e, role)}
                                        >
                                            <Edit className="h-4 w-4" />
                                        </Button>
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </div>

            <RoleDetailsSheet
                role={selectedRole}
                open={isSheetOpen}
                onOpenChange={setIsSheetOpen}
            />

            <RoleEditorSheet
                open={isEditorOpen}
                onOpenChange={setIsEditorOpen}
                initialData={selectedRole}
            />
        </div>
    );
}
