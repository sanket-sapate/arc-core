import { useState } from "react";
import { type MetaFunction } from "react-router";
import { useFrameworks, useCreateFramework } from "~/features/tprm/api/frameworks";
import { useForm } from "react-hook-form";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import { Textarea } from "~/components/ui/textarea";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "~/components/ui/table";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "~/components/ui/dialog";
import { Plus, FileText } from "lucide-react";
import { format } from "date-fns";

export const meta: MetaFunction = () => {
    return [
        { title: "Frameworks | ARC TPRM" },
        { name: "description", content: "Manage risk and compliance frameworks" },
    ];
};

export default function FrameworksPage() {
    const { data: frameworksData, isLoading } = useFrameworks();
    const createMutation = useCreateFramework();

    // Fallback safe array mapping
    const frameworks = Array.isArray(frameworksData) ? frameworksData : (frameworksData as any)?.data || [];

    const [isCreateOpen, setIsCreateOpen] = useState(false);
    const { register, handleSubmit, reset, formState: { isSubmitting } } = useForm({
        defaultValues: { name: "", version: "", description: "" }
    });

    const onSubmit = (data: any) => {
        createMutation.mutate(data, {
            onSuccess: () => {
                setIsCreateOpen(false);
                reset();
            }
        });
    };

    return (
        <div className="flex-1 space-y-6 p-8 pt-6 max-w-7xl mx-auto">
            <div className="flex items-center justify-between space-y-2">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight">Compliance Frameworks</h2>
                    <p className="text-muted-foreground mt-1 text-sm">Manage standard compliance questionnaires</p>
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
                            <TableHead>Name</TableHead>
                            <TableHead>Version</TableHead>
                            <TableHead className="w-[40%]">Description</TableHead>
                            <TableHead className="text-right">Last Updated</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {isLoading ? (
                            <TableRow>
                                <TableCell colSpan={4} className="h-24 text-center">Loading frameworks...</TableCell>
                            </TableRow>
                        ) : frameworks.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={4} className="h-24 text-center">No frameworks available. Create one to get started.</TableCell>
                            </TableRow>
                        ) : (
                            frameworks.map((fw: any) => (
                                <TableRow key={fw.id}>
                                    <TableCell className="font-medium">
                                        <div className="flex items-center gap-2">
                                            <FileText className="h-4 w-4 text-primary" />
                                            {fw.name}
                                        </div>
                                    </TableCell>
                                    <TableCell className="font-mono text-sm">{fw.version}</TableCell>
                                    <TableCell className="text-muted-foreground whitespace-pre-wrap">{fw.description}</TableCell>
                                    <TableCell className="text-right text-muted-foreground text-sm">
                                        {fw.updated_at ? format(new Date(fw.updated_at), "MMM d, yyyy") : "Never"}
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
