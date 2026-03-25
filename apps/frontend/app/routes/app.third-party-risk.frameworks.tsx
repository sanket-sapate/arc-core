import { useState } from "react";
import { type MetaFunction, useNavigate } from "react-router";
import {
    useFrameworks,
    useCreateFramework,
    useUpdateFramework,
    useDeleteFramework,
} from "~/features/tprm/api/frameworks";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import { Textarea } from "~/components/ui/textarea";
import { Badge } from "~/components/ui/badge";
import { Skeleton } from "~/components/ui/skeleton";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "~/components/ui/table";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "~/components/ui/select";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "~/components/ui/dialog";
import { Plus, Edit, Trash2, MessageSquare } from "lucide-react";
import { format } from "date-fns";

export const meta: MetaFunction = () => {
    return [
        { title: "Frameworks | ARC TPRM" },
        { name: "description", content: "Manage risk and compliance frameworks" },
    ];
};

export default function FrameworksPage() {
    const navigate = useNavigate();
    const { data: frameworksData, isLoading } = useFrameworks();
    const createMutation = useCreateFramework();
    const updateMutation = useUpdateFramework();
    const deleteMutation = useDeleteFramework();

    const frameworks = Array.isArray(frameworksData) ? frameworksData : (frameworksData as any)?.data || [];

    const [isCreateOpen, setIsCreateOpen] = useState(false);
    const [editingFw, setEditingFw] = useState<any>(null);

    const { register, handleSubmit, reset, formState: { isSubmitting } } = useForm({
        defaultValues: { name: "", version: "", description: "" }
    });
    const editForm = useForm({ defaultValues: { name: "", version: "", description: "" } });

    const onSubmit = (data: any) => {
        createMutation.mutate(data, {
            onSuccess: () => {
                setIsCreateOpen(false);
                reset();
                toast.success("Framework created");
            },
            onError: (err) => toast.error(err.message || "Failed to create framework"),
        });
    };

    const onEdit = (data: any) => {
        if (!editingFw) return;
        updateMutation.mutate({ id: editingFw.id, payload: data }, {
            onSuccess: () => {
                setEditingFw(null);
                editForm.reset();
                toast.success("Framework updated");
            },
            onError: (err) => toast.error(err.message || "Failed to update framework"),
        });
    };

    const handleDelete = (id: string) => {
        if (!window.confirm("Delete this framework? Associated questions will also be removed.")) return;
        deleteMutation.mutate(id, {
            onSuccess: () => {
                toast.success("Framework deleted");
            },
            onError: (err: any) => toast.error(err.message || "Failed to delete framework"),
        });
    };

    const openEdit = (fw: any) => {
        setEditingFw(fw);
        editForm.reset({ name: fw.name, version: fw.version, description: fw.description || "" });
    };

    return (
        <div className="flex-1 space-y-6 p-8 pt-6 max-w-7xl mx-auto">
            <div className="flex items-center justify-between space-y-2">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight">Compliance Frameworks</h2>
                    <p className="text-muted-foreground mt-1 text-sm">Manage standard compliance questionnaires and their assessment questions</p>
                </div>

                <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
                    <DialogTrigger asChild>
                        <Button>
                            <Plus className="mr-2 h-4 w-4" />
                            New Framework
                        </Button>
                    </DialogTrigger>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Create New Framework</DialogTitle>
                            <DialogDescription>
                                Set up a new baseline structure.
                            </DialogDescription>
                        </DialogHeader>
                        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="name">Framework Name</Label>
                                <Input id="name" {...register("name", { required: true })} placeholder="e.g. ISO 27001" />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="version">Version</Label>
                                <Input id="version" {...register("version", { required: true })} placeholder="e.g. v2022" />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="description">Description</Label>
                                <Textarea id="description" {...register("description")} placeholder="Brief overview..." />
                            </div>
                            <DialogFooter>
                                <Button type="submit" disabled={isSubmitting || createMutation.isPending}>
                                    {(isSubmitting || createMutation.isPending) ? "Creating..." : "Save Framework"}
                                </Button>
                            </DialogFooter>
                        </form>
                    </DialogContent>
                </Dialog>
            </div>

            <div className="rounded-md border bg-card">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead className="w-[25%]">Name</TableHead>
                            <TableHead className="w-[12%]">Version</TableHead>
                            <TableHead className="w-[35%]">Description</TableHead>
                            <TableHead className="w-[15%]">Last Updated</TableHead>
                            <TableHead className="text-right w-[13%]">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {isLoading ? (
                            <TableRow>
                                <TableCell colSpan={5} className="h-24 text-center">Loading frameworks...</TableCell>
                            </TableRow>
                        ) : frameworks.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={5} className="h-24 text-center">No frameworks available. Create one to get started.</TableCell>
                            </TableRow>
                        ) : (
                            frameworks.map((fw: any) => (
                                <TableRow key={fw.id} className="hover:bg-muted/30">
                                    <TableCell className="font-medium">{fw.name}</TableCell>
                                    <TableCell className="font-mono text-sm">{fw.version}</TableCell>
                                    <TableCell className="text-muted-foreground whitespace-pre-wrap">{fw.description}</TableCell>
                                    <TableCell className="text-muted-foreground text-sm">
                                        {fw.updated_at ? format(new Date(fw.updated_at), "MMM d, yyyy") : "Never"}
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <div className="flex justify-end gap-2">
                                            <Button 
                                                variant="ghost" 
                                                size="sm" 
                                                onClick={() => navigate(`/app/third-party-risk/frameworks/${fw.id}`)}
                                                title="Edit Questions"
                                            >
                                                <MessageSquare className="h-4 w-4 text-muted-foreground" />
                                            </Button>
                                            <Button variant="ghost" size="sm" onClick={() => openEdit(fw)}>
                                                <Edit className="h-4 w-4 text-muted-foreground" />
                                            </Button>
                                            <Button variant="ghost" size="sm" onClick={() => handleDelete(fw.id)}>
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

            {/* Edit Framework Dialog */}
            <Dialog open={!!editingFw} onOpenChange={(o) => !o && setEditingFw(null)}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Edit Framework</DialogTitle>
                        <DialogDescription>Update framework details.</DialogDescription>
                    </DialogHeader>
                    <form onSubmit={editForm.handleSubmit(onEdit)} className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="edit-name">Framework Name</Label>
                            <Input id="edit-name" {...editForm.register("name", { required: true })} />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="edit-version">Version</Label>
                            <Input id="edit-version" {...editForm.register("version", { required: true })} />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="edit-description">Description</Label>
                            <Textarea id="edit-description" {...editForm.register("description")} />
                        </div>
                        <DialogFooter>
                            <Button type="submit" disabled={updateMutation.isPending}>
                                {updateMutation.isPending ? "Saving..." : "Save Changes"}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
        </div>
    );
}
