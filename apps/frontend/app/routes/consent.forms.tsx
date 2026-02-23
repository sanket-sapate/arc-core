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
import { ConsentFormEditor } from "~/features/consent/components/ConsentFormEditor";
import { useConsentForms, useCreateConsentForm, useUpdateConsentForm, useDeleteConsentForm } from "~/features/consent/api/consent-forms";
import type { ConsentForm } from "~/features/consent/types/consent-form";

export default function ConsentFormsPage() {
    const [isSheetOpen, setIsSheetOpen] = useState(false);
    const [editingForm, setEditingForm] = useState<ConsentForm | null>(null);

    const { data: consentForms, isLoading } = useConsentForms();
    const createConsentForm = useCreateConsentForm();
    const updateConsentForm = useUpdateConsentForm();
    const deleteConsentForm = useDeleteConsentForm();

    const handleOpenCreate = () => {
        setEditingForm(null);
        setIsSheetOpen(true);
    };

    const handleOpenEdit = (form: ConsentForm) => {
        setEditingForm(form);
        setIsSheetOpen(true);
    };

    const handleSubmit = (data: ConsentForm) => {
        if (editingForm) {
            updateConsentForm.mutate(
                { id: editingForm.id!, form: data },
                {
                    onSuccess: () => {
                        setIsSheetOpen(false);
                        toast.success("Consent form updated successfully!");
                    },
                    onError: (err) => {
                        toast.error(err.message || "Failed to update consent form");
                    },
                }
            );
        } else {
            createConsentForm.mutate(data, {
                onSuccess: () => {
                    setIsSheetOpen(false);
                    toast.success("Consent form created successfully!");
                },
                onError: (err) => {
                    toast.error(err.message || "Failed to create consent form");
                },
            });
        }
    };

    const handleDelete = (id: string) => {
        if (window.confirm("Are you sure you want to delete this consent form?")) {
            deleteConsentForm.mutate(id, {
                onSuccess: () => {
                    toast.success("Consent form deleted successfully!");
                },
                onError: (err) => {
                    toast.error(err.message || "Failed to delete consent form");
                },
            });
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div className="space-y-1">
                    <h2 className="text-2xl font-bold tracking-tight">Consent Forms</h2>
                    <p className="text-muted-foreground">
                        Manage your consent capturing forms and their associated purposes.
                    </p>
                </div>

                <Button onClick={handleOpenCreate}>
                    <Plus className="mr-2 h-4 w-4" />
                    Create Form
                </Button>

                <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
                    <SheetContent className="overflow-y-auto sm:max-w-[700px] w-full p-4 sm:p-6">
                        <SheetHeader className="mb-6">
                            <SheetTitle>{editingForm ? "Edit Consent Form" : "Create Consent Form"}</SheetTitle>
                            <SheetDescription>
                                {editingForm
                                    ? "Modify your consent form configuration."
                                    : "Add a new consent form to capture user preferences and link processing purposes."}
                            </SheetDescription>
                        </SheetHeader>
                        <ConsentFormEditor
                            key={editingForm ? editingForm.id : "new"}
                            initialData={editingForm || undefined}
                            onSubmit={handleSubmit}
                            isLoading={createConsentForm.isPending || updateConsentForm.isPending}
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
                            <TableHead>Purposes Configured</TableHead>
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
                                    <TableCell><Skeleton className="h-4 w-[80px]" /></TableCell>
                                    <TableCell><Skeleton className="h-5 w-[60px] rounded-full" /></TableCell>
                                    <TableCell className="text-right">
                                        <Skeleton className="h-8 w-16 ml-auto" />
                                    </TableCell>
                                </TableRow>
                            ))
                        ) : consentForms?.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={5} className="h-24 text-center text-muted-foreground">
                                    No consent forms found. Create one.
                                </TableCell>
                            </TableRow>
                        ) : (
                            consentForms?.map((form) => (
                                <TableRow key={form.id}>
                                    <TableCell className="font-medium">{form.name}</TableCell>
                                    <TableCell className="text-muted-foreground truncate max-w-[300px]" title={form.description || ""}>
                                        {form.description || "—"}
                                    </TableCell>
                                    <TableCell>
                                        <Badge variant="outline">{form.purpose_ids?.length || 0} purposes</Badge>
                                    </TableCell>
                                    <TableCell>
                                        {form.active ? (
                                            <Badge variant="default">Active</Badge>
                                        ) : (
                                            <Badge variant="secondary">Inactive</Badge>
                                        )}
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <div className="flex justify-end gap-2">
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => handleOpenEdit(form)}
                                            >
                                                <Edit className="h-4 w-4 text-muted-foreground" />
                                            </Button>
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => handleDelete(form.id!)}
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
