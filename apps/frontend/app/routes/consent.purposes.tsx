import { useState } from "react";
import { Plus, Edit } from "lucide-react";
import { toast } from "sonner";
import { Button } from "~/components/ui/button";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "~/components/ui/table";
import {
    Sheet,
    SheetContent,
    SheetDescription,
    SheetHeader,
    SheetTitle,
} from "~/components/ui/sheet";
import { Badge } from "~/components/ui/badge";
import { Skeleton } from "~/components/ui/skeleton";
import { PurposeEditor } from "~/features/consent/components/PurposeEditor";
import { usePurposes, useCreatePurpose, useUpdatePurpose } from "~/features/consent/api/purposes";
import type { Purpose } from "~/features/consent/types/purpose";

export default function PurposesPage() {
    const [isSheetOpen, setIsSheetOpen] = useState(false);
    const [editingPurpose, setEditingPurpose] = useState<Purpose | null>(null);

    const { data: purposes, isLoading } = usePurposes();
    const createPurpose = useCreatePurpose();
    const updatePurpose = useUpdatePurpose();

    const handleOpenCreate = () => {
        setEditingPurpose(null);
        setIsSheetOpen(true);
    };

    const handleOpenEdit = (purpose: Purpose) => {
        setEditingPurpose(purpose);
        setIsSheetOpen(true);
    };

    const handleSubmit = (data: Purpose) => {
        if (editingPurpose) {
            updatePurpose.mutate(
                { id: editingPurpose.id!, purpose: data },
                {
                    onSuccess: () => {
                        setIsSheetOpen(false);
                        toast.success("Purpose updated successfully!");
                    },
                    onError: (err) => {
                        toast.error(err.message || "Failed to update purpose");
                    },
                }
            );
        } else {
            createPurpose.mutate(data, {
                onSuccess: () => {
                    setIsSheetOpen(false);
                    toast.success("Purpose created successfully!");
                },
                onError: (err) => {
                    toast.error(err.message || "Failed to create purpose");
                },
            });
        }
    };

    const formatBasis = (basis: string) => {
        return basis.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div className="space-y-1">
                    <h2 className="text-2xl font-bold tracking-tight">Processing Purposes</h2>
                    <p className="text-muted-foreground">
                        Define the legal purposes mapping to user data collection across your organization.
                    </p>
                </div>

                <Button onClick={handleOpenCreate}>
                    <Plus className="mr-2 h-4 w-4" />
                    Create Purpose
                </Button>

                <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
                    <SheetContent className="overflow-y-auto sm:max-w-[700px] w-full p-4 sm:p-6">
                        <SheetHeader className="mb-6">
                            <SheetTitle>{editingPurpose ? "Edit Purpose" : "Create Purpose"}</SheetTitle>
                            <SheetDescription>
                                {editingPurpose
                                    ? "Modify your data processing purpose configuration."
                                    : "Add a new processing purpose to link to data categories and consent forms."}
                            </SheetDescription>
                        </SheetHeader>
                        <PurposeEditor
                            key={editingPurpose ? editingPurpose.id : "new"}
                            initialData={editingPurpose || undefined}
                            onSubmit={handleSubmit}
                            isLoading={createPurpose.isPending || updatePurpose.isPending}
                        />
                    </SheetContent>
                </Sheet>
            </div>

            <div className="rounded-md border bg-card">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Name</TableHead>
                            <TableHead>Description</TableHead>
                            <TableHead>Legal Basis</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {isLoading ? (
                            Array.from({ length: 3 }).map((_, index) => (
                                <TableRow key={index}>
                                    <TableCell><Skeleton className="h-4 w-[150px]" /></TableCell>
                                    <TableCell><Skeleton className="h-4 w-[250px]" /></TableCell>
                                    <TableCell><Skeleton className="h-4 w-[120px]" /></TableCell>
                                    <TableCell><Skeleton className="h-5 w-[60px] rounded-full" /></TableCell>
                                    <TableCell className="text-right">
                                        <Skeleton className="h-8 w-10 ml-auto" />
                                    </TableCell>
                                </TableRow>
                            ))
                        ) : purposes?.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={5} className="h-24 text-center text-muted-foreground">
                                    No purposes found. Create one.
                                </TableCell>
                            </TableRow>
                        ) : (
                            purposes?.map((purpose) => (
                                <TableRow key={purpose.id}>
                                    <TableCell className="font-medium">{purpose.name}</TableCell>
                                    <TableCell className="text-muted-foreground truncate max-w-[300px]" title={purpose.description || ""}>
                                        {purpose.description || "—"}
                                    </TableCell>
                                    <TableCell>
                                        <Badge variant="outline">{formatBasis(purpose.legal_basis || "consent")}</Badge>
                                    </TableCell>
                                    <TableCell>
                                        {purpose.active ? (
                                            <Badge variant="default">Active</Badge>
                                        ) : (
                                            <Badge variant="secondary">Inactive</Badge>
                                        )}
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => handleOpenEdit(purpose)}
                                        >
                                            <Edit className="h-4 w-4 text-muted-foreground" />
                                        </Button>
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </div>
        </div>
    );
}
