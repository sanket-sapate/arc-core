import { useState } from "react";
import { Plus, Edit, Trash2, ExternalLink } from "lucide-react";
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
import { VendorEditor } from "~/features/tprm/components/VendorEditor";
import { NetworkDiscoveryModal } from "~/features/tprm/components/NetworkDiscoveryModal";
import { useVendors, useCreateVendor, useUpdateVendor, useDeleteVendor, createVendorDPA, createVendorAssessment } from "~/features/tprm/api/vendors";
import type { Vendor } from "~/features/tprm/types/vendor";

export default function VendorsPage() {
    const [isSheetOpen, setIsSheetOpen] = useState(false);
    const [editingVendor, setEditingVendor] = useState<Vendor | null>(null);

    const { data: vendors, isLoading } = useVendors();
    const createVendor = useCreateVendor();
    const updateVendor = useUpdateVendor();
    const deleteVendor = useDeleteVendor();

    const handleOpenCreate = () => {
        setEditingVendor(null);
        setIsSheetOpen(true);
    };

    const handleOpenEdit = (vendor: Vendor) => {
        setEditingVendor(vendor);
        setIsSheetOpen(true);
    };

    const handleSubmit = (data: Vendor) => {
        if (editingVendor) {
            updateVendor.mutate(
                { id: editingVendor.id!, vendor: data },
                {
                    onSuccess: () => {
                        setIsSheetOpen(false);
                        toast.success("Vendor updated successfully!");
                    },
                    onError: (err) => {
                        toast.error(err.message || "Failed to update vendor");
                    },
                }
            );
        } else {
            createVendor.mutate(data, {
                onSuccess: async (newVendor) => {
                    try {
                        let dpaPromise: Promise<any> = Promise.resolve();
                        let assessmentPromise: Promise<any> = Promise.resolve();

                        if (data.requires_dpa && newVendor?.id) {
                            dpaPromise = createVendorDPA(newVendor.id);
                        }
                        if (data.requires_assessment && newVendor?.id) {
                            assessmentPromise = createVendorAssessment(newVendor.id);
                        }

                        await Promise.all([dpaPromise, assessmentPromise]);

                        setIsSheetOpen(false);
                        toast.success("Vendor created successfully!");
                    } catch (err) {
                        toast.error("Vendor created, but failed to initialize required DPA/Assessments.");
                    }
                },
                onError: (err) => {
                    toast.error(err.message || "Failed to create vendor");
                },
            });
        }
    };

    const handleDelete = (id: string) => {
        if (window.confirm("Are you sure you want to remove this vendor? This may affect associated DPAs and Assessments.")) {
            deleteVendor.mutate(id, {
                onSuccess: () => {
                    toast.success("Vendor removed successfully!");
                },
                onError: (err) => {
                    toast.error(err.message || "Failed to remove vendor");
                },
            });
        }
    };

    const getRiskBadge = (level: string) => {
        switch (level?.toLowerCase()) {
            case 'low': return <Badge className="bg-emerald-500/15 text-emerald-600 hover:bg-emerald-500/25 border-none">Low Risk</Badge>;
            case 'medium': return <Badge className="bg-amber-500/15 text-amber-600 hover:bg-amber-500/25 border-none">Medium Risk</Badge>;
            case 'high': return <Badge className="bg-orange-500/15 text-orange-600 hover:bg-orange-500/25 border-none">High Risk</Badge>;
            case 'critical': return <Badge variant="destructive">Critical Risk</Badge>;
            default: return <Badge variant="outline" className="capitalize">{level?.replace('_', ' ') || 'Unknown'}</Badge>;
        }
    };

    const getComplianceBadge = (status: string) => {
        switch (status?.toLowerCase()) {
            case 'compliant': return <Badge className="bg-emerald-500/15 text-emerald-600 hover:bg-emerald-500/25 border-none">Compliant</Badge>;
            case 'under_review': return <Badge className="bg-blue-500/15 text-blue-600 hover:bg-blue-500/25 border-none">Under Review</Badge>;
            case 'non_compliant': return <Badge variant="destructive">Non-Compliant</Badge>;
            default: return <Badge variant="outline" className="capitalize">{status?.replace('_', ' ') || 'Unknown'}</Badge>;
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div className="space-y-1">
                    <h2 className="text-2xl font-bold tracking-tight">Third-Party Vendors</h2>
                    <p className="text-muted-foreground">
                        Manage your external processors and service providers.
                    </p>
                </div>

                <div className="flex gap-2">
                    <NetworkDiscoveryModal />
                    <Button onClick={handleOpenCreate}>
                        <Plus className="mr-2 h-4 w-4" />
                        Add Vendor
                    </Button>
                </div>

                <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
                    <SheetContent className="overflow-y-auto sm:max-w-[700px] w-full p-4 sm:p-6">
                        <SheetHeader className="mb-6">
                            <SheetTitle>{editingVendor ? "Edit Vendor" : "Add Vendor"}</SheetTitle>
                            <SheetDescription>
                                {editingVendor
                                    ? "Update external processor details and compliance posture."
                                    : "Register a new third-party vendor to track risk and associate contracts."}
                            </SheetDescription>
                        </SheetHeader>
                        <VendorEditor
                            key={editingVendor ? editingVendor.id : "new"}
                            initialData={editingVendor || undefined}
                            onSubmit={handleSubmit}
                            isLoading={createVendor.isPending || updateVendor.isPending}
                        />
                    </SheetContent>
                </Sheet>
            </div>

            <div className="rounded-md border bg-card">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Vendor Name</TableHead>
                            <TableHead>Website</TableHead>
                            <TableHead>System Risk</TableHead>
                            <TableHead>Compliance Check</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {isLoading ? (
                            Array.from({ length: 4 }).map((_, index) => (
                                <TableRow key={index}>
                                    <TableCell><Skeleton className="h-4 w-[150px]" /></TableCell>
                                    <TableCell><Skeleton className="h-4 w-[180px]" /></TableCell>
                                    <TableCell><Skeleton className="h-5 w-[80px] rounded-full" /></TableCell>
                                    <TableCell><Skeleton className="h-5 w-[100px] rounded-full" /></TableCell>
                                    <TableCell><Skeleton className="h-5 w-[60px] rounded-full" /></TableCell>
                                    <TableCell className="text-right">
                                        <Skeleton className="h-8 w-16 ml-auto" />
                                    </TableCell>
                                </TableRow>
                            ))
                        ) : vendors?.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={6} className="h-32 text-center text-muted-foreground">
                                    No external vendors registered in the directory.
                                </TableCell>
                            </TableRow>
                        ) : (
                            vendors?.map((vendor) => (
                                <TableRow key={vendor.id}>
                                    <TableCell className="font-medium">
                                        {vendor.name}
                                    </TableCell>
                                    <TableCell>
                                        {vendor.website ? (
                                            <a
                                                href={vendor.website.startsWith('http') ? vendor.website : `https://${vendor.website}`}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="flex items-center gap-1.5 text-sm text-blue-600 hover:underline"
                                            >
                                                {vendor.website.replace(/^https?:\/\//, '')}
                                                <ExternalLink className="h-3 w-3" />
                                            </a>
                                        ) : (
                                            <span className="text-muted-foreground">—</span>
                                        )}
                                    </TableCell>
                                    <TableCell>
                                        {getRiskBadge(vendor.risk_level)}
                                    </TableCell>
                                    <TableCell>
                                        {getComplianceBadge(vendor.compliance_status)}
                                    </TableCell>
                                    <TableCell>
                                        {vendor.active ? (
                                            <Badge variant="outline" className="border-emerald-200 text-emerald-700 bg-emerald-50">Active</Badge>
                                        ) : (
                                            <Badge variant="secondary">Inactive</Badge>
                                        )}
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <div className="flex justify-end gap-2">
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => handleOpenEdit(vendor)}
                                            >
                                                <Edit className="h-4 w-4 text-muted-foreground" />
                                            </Button>
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => handleDelete(vendor.id!)}
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
