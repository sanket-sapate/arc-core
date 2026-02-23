import { useState } from "react";
import { Plus, Edit, Trash2 } from "lucide-react";
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
import { DPAEditor } from "~/features/tprm/components/DPAEditor";
import { useDPAs, useCreateDPA, useUpdateDPA, useDeleteDPA } from "~/features/tprm/api/dpas";
import { useVendors } from "~/features/tprm/api/vendors";
import type { Dpa } from "~/features/tprm/types/dpa";

export default function DPAsPage() {
    const [isSheetOpen, setIsSheetOpen] = useState(false);
    const [editingDPA, setEditingDPA] = useState<Dpa | null>(null);

    const { data: dpas, isLoading: isDPAsLoading } = useDPAs();
    const { data: vendors, isLoading: isVendorsLoading } = useVendors();

    const createDPA = useCreateDPA();
    const updateDPA = useUpdateDPA();
    const deleteDPA = useDeleteDPA();

    const isLoading = isDPAsLoading || isVendorsLoading;

    const handleOpenCreate = () => {
        setEditingDPA(null);
        setIsSheetOpen(true);
    };

    const handleOpenEdit = (dpa: Dpa) => {
        setEditingDPA(dpa);
        setIsSheetOpen(true);
    };

    const handleSubmit = (data: Dpa) => {
        if (editingDPA) {
            updateDPA.mutate(
                { id: editingDPA.id!, dpa: data },
                {
                    onSuccess: () => {
                        setIsSheetOpen(false);
                        toast.success("DPA updated successfully!");
                    },
                    onError: (err) => {
                        toast.error(err.message || "Failed to update DPA");
                    },
                }
            );
        } else {
            createDPA.mutate(data, {
                onSuccess: () => {
                    setIsSheetOpen(false);
                    toast.success("DPA created successfully!");
                },
                onError: (err) => {
                    toast.error(err.message || "Failed to create DPA");
                },
            });
        }
    };

    const handleDelete = (id: string) => {
        if (window.confirm("Are you sure you want to completely remove this DPA record?")) {
            deleteDPA.mutate(id, {
                onSuccess: () => {
                    toast.success("DPA removed successfully!");
                },
                onError: (err) => {
                    toast.error(err.message || "Failed to remove DPA");
                },
            });
        }
    };

    const getStatusBadge = (status: string) => {
        switch (status?.toLowerCase()) {
            case 'draft': return <Badge variant="secondary" className="bg-gray-100 text-gray-700 hover:bg-gray-200">Draft</Badge>;
            case 'sent': return <Badge className="bg-blue-500/15 text-blue-600 hover:bg-blue-500/25 border-none">Sent</Badge>;
            case 'signed': return <Badge className="bg-emerald-500/15 text-emerald-600 hover:bg-emerald-500/25 border-none">Signed</Badge>;
            case 'expired': return <Badge variant="destructive">Expired</Badge>;
            default: return <Badge variant="outline" className="capitalize">{status || 'Unknown'}</Badge>;
        }
    };

    const getVendorName = (vendorId: string) => {
        if (!vendors) return "Loading...";
        const vendor = vendors.find(v => v.id === vendorId);
        return vendor ? vendor.name : <span className="text-muted-foreground text-xs font-mono">{vendorId.split('-')[0]}...</span>;
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div className="space-y-1">
                    <h2 className="text-2xl font-bold tracking-tight">Data Processing Agreements (DPAs)</h2>
                    <p className="text-muted-foreground">
                        Track contractual safeguards and data transfers with your sub-processors.
                    </p>
                </div>

                <Button onClick={handleOpenCreate}>
                    <Plus className="mr-2 h-4 w-4" />
                    New DPA
                </Button>

                <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
                    <SheetContent className="overflow-y-auto sm:max-w-[500px] w-full p-4 sm:p-6">
                        <SheetHeader className="mb-6">
                            <SheetTitle>{editingDPA ? "Edit Agreement" : "Create Agreement"}</SheetTitle>
                            <SheetDescription>
                                {editingDPA
                                    ? "Update DPA status, dates, and contract notes."
                                    : "Link a new Data Processing Agreement to an existing Vendor."}
                            </SheetDescription>
                        </SheetHeader>
                        <DPAEditor
                            key={editingDPA ? editingDPA.id : "new"}
                            initialData={editingDPA || undefined}
                            onSubmit={handleSubmit}
                            isLoading={createDPA.isPending || updateDPA.isPending}
                        />
                    </SheetContent>
                </Sheet>
            </div>

            <div className="rounded-md border bg-card">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Vendor / Sub-processor</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Effective Date</TableHead>
                            <TableHead>Notes</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {isLoading ? (
                            Array.from({ length: 3 }).map((_, index) => (
                                <TableRow key={index}>
                                    <TableCell><Skeleton className="h-4 w-[200px]" /></TableCell>
                                    <TableCell><Skeleton className="h-5 w-[80px] rounded-full" /></TableCell>
                                    <TableCell><Skeleton className="h-4 w-[120px]" /></TableCell>
                                    <TableCell><Skeleton className="h-4 w-[150px]" /></TableCell>
                                    <TableCell className="text-right">
                                        <Skeleton className="h-8 w-16 ml-auto" />
                                    </TableCell>
                                </TableRow>
                            ))
                        ) : dpas?.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={5} className="h-32 text-center text-muted-foreground">
                                    No Data Processing Agreements found.
                                </TableCell>
                            </TableRow>
                        ) : (
                            dpas?.map((dpa) => (
                                <TableRow key={dpa.id}>
                                    <TableCell className="font-medium">
                                        {getVendorName(dpa.vendor_id)}
                                    </TableCell>
                                    <TableCell>
                                        {getStatusBadge(dpa.status)}
                                    </TableCell>
                                    <TableCell>
                                        {dpa.effective_date ? new Date(dpa.effective_date).toLocaleDateString() : <span className="text-muted-foreground">—</span>}
                                    </TableCell>
                                    <TableCell className="max-w-[250px] truncate text-muted-foreground">
                                        {dpa.notes || "—"}
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <div className="flex justify-end gap-2">
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => handleOpenEdit(dpa)}
                                            >
                                                <Edit className="h-4 w-4 text-muted-foreground" />
                                            </Button>
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => handleDelete(dpa.id!)}
                                            >
                                                <Trash2 className="h-4 w-4 text-destructive" />
                                            </Button>
                                        </div>
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
