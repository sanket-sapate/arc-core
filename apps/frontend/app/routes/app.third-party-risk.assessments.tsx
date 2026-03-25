import { useState } from "react";
import { type MetaFunction, useNavigate } from "react-router";
import { useAssessments, useCreateAssessment, useUpdateAssessmentStatus } from "~/features/tprm/api/assessments";
import { useVendors } from "~/features/tprm/api/vendors";
import { useFrameworks } from "~/features/tprm/api/frameworks";
import { toast } from "sonner";
import { Button } from "~/components/ui/button";
import { Label } from "~/components/ui/label";
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
} from "~/components/ui/dialog";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "~/components/ui/select";
import { Badge } from "~/components/ui/badge";
import { Skeleton } from "~/components/ui/skeleton";
import { ClipboardList, CalendarClock, Plus } from "lucide-react";
import { format, isPast } from "date-fns";

export const meta: MetaFunction = () => {
    return [
        { title: "Assessments | ARC TPRM" },
        { name: "description", content: "Vendor risk assessments" },
    ];
};

export default function AssessmentsPage() {
    const navigate = useNavigate();
    const { data: assessmentsData, isLoading: isLoadingAssessments } = useAssessments();
    const { data: vendorsData, isLoading: isLoadingVendors } = useVendors();
    const { data: frameworksData } = useFrameworks();
    const createAssessment = useCreateAssessment();
    const updateStatus = useUpdateAssessmentStatus();

    const assessments = Array.isArray(assessmentsData) ? assessmentsData : (assessmentsData as any)?.data || [];
    const vendors = Array.isArray(vendorsData) ? vendorsData : (vendorsData as any)?.data || [];
    const frameworks = Array.isArray(frameworksData) ? frameworksData : (frameworksData as any)?.data || [];

    const [isCreateOpen, setIsCreateOpen] = useState(false);
    const [newVendorId, setNewVendorId] = useState("");
    const [newFrameworkId, setNewFrameworkId] = useState("");

    const getVendorName = (vendorId: string) => {
        if (!vendorId) return "No Vendor";
        const vendor = vendors.find((v: any) => v.id === vendorId);
        return vendor ? vendor.name : "Unknown Vendor";
    };

    const getFrameworkName = (frameworkId: string) => {
        if (!frameworkId) return "";
        const fw = frameworks.find((f: any) => f.id === frameworkId);
        return fw ? fw.name : "";
    };

    const getStatusBadge = (status: string) => {
        switch (status) {
            case "completed": return <Badge className="bg-green-100 text-green-800 hover:bg-green-100">Completed</Badge>;
            case "in_progress": return <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-100">In Progress</Badge>;
            case "under_review": return <Badge className="bg-amber-100 text-amber-800 hover:bg-amber-100">Under Review</Badge>;
            default: return <Badge variant="outline" className="capitalize">{status || "Draft"}</Badge>;
        }
    };

    const handleCreate = () => {
        if (!newVendorId || !newFrameworkId) {
            toast.error("Select both a vendor and a framework");
            return;
        }
        createAssessment.mutate(
            { vendor_id: newVendorId, framework_id: newFrameworkId, status: "draft" },
            {
                onSuccess: () => {
                    setIsCreateOpen(false);
                    setNewVendorId("");
                    setNewFrameworkId("");
                    toast.success("Assessment created");
                },
                onError: (err) => toast.error(err.message || "Failed to create assessment"),
            }
        );
    };

    const handleStatusChange = (id: string, status: string) => {
        updateStatus.mutate({ id, status }, {
            onSuccess: () => toast.success("Status updated"),
            onError: (err) => toast.error(err.message || "Failed to update status"),
        });
    };

    const isLoading = isLoadingAssessments || isLoadingVendors;

    return (
        <div className="flex-1 space-y-6 p-8 pt-6 max-w-7xl mx-auto">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight">Assessments Dashboard</h2>
                    <p className="text-muted-foreground mt-1 text-sm">Create, track, and review vendor risk assessments</p>
                </div>
                <Button onClick={() => setIsCreateOpen(true)}>
                    <Plus className="mr-2 h-4 w-4" />
                    New Assessment
                </Button>
            </div>

            <div className="rounded-md border bg-card">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Vendor</TableHead>
                            <TableHead>Framework</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Score</TableHead>
                            <TableHead className="text-right">Created</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {isLoading ? (
                            Array.from({ length: 3 }).map((_, i) => (
                                <TableRow key={i}>
                                    <TableCell><Skeleton className="h-4 w-[160px]" /></TableCell>
                                    <TableCell><Skeleton className="h-4 w-[120px]" /></TableCell>
                                    <TableCell><Skeleton className="h-5 w-[80px] rounded-full" /></TableCell>
                                    <TableCell><Skeleton className="h-4 w-[40px]" /></TableCell>
                                    <TableCell className="text-right"><Skeleton className="h-4 w-[90px] ml-auto" /></TableCell>
                                </TableRow>
                            ))
                        ) : assessments.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={5} className="h-32 text-center">
                                    <div className="flex flex-col items-center gap-2 text-muted-foreground">
                                        <ClipboardList className="h-8 w-8" />
                                        <p>No assessments found. Create one to get started.</p>
                                    </div>
                                </TableCell>
                            </TableRow>
                        ) : (
                            assessments.map((assessment: any) => (
                                <TableRow
                                    key={assessment.id}
                                    className="cursor-pointer hover:bg-muted/50"
                                    onClick={() => navigate(`/app/third-party-risk/assessments/${assessment.id}`)}
                                >
                                    <TableCell className="font-medium">
                                        <div className="flex items-center gap-2">
                                            <ClipboardList className="h-4 w-4 text-primary" />
                                            {getVendorName(assessment.vendor_id)}
                                        </div>
                                    </TableCell>
                                    <TableCell className="text-muted-foreground">
                                        {getFrameworkName(assessment.framework_id) || <span className="text-xs font-mono">{assessment.framework_id?.split('-')[0]}...</span>}
                                    </TableCell>
                                    <TableCell onClick={(e) => e.stopPropagation()}>
                                        <Select
                                            defaultValue={assessment.status}
                                            onValueChange={(v) => handleStatusChange(assessment.id, v)}
                                        >
                                            <SelectTrigger className="w-[140px] h-8 text-xs">
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="draft">Draft</SelectItem>
                                                <SelectItem value="in_progress">In Progress</SelectItem>
                                                <SelectItem value="under_review">Under Review</SelectItem>
                                                <SelectItem value="completed">Completed</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </TableCell>
                                    <TableCell className="text-muted-foreground">
                                        {assessment.score != null ? `${assessment.score}%` : "—"}
                                    </TableCell>
                                    <TableCell className="text-right text-muted-foreground text-sm">
                                        {assessment.created_at ? format(new Date(assessment.created_at), "MMM d, yyyy") : "—"}
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </div>

            {/* Create Assessment Dialog */}
            <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Create Assessment</DialogTitle>
                        <DialogDescription>Link a vendor to a compliance framework to begin a new assessment.</DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                        <div className="space-y-2">
                            <Label>Vendor</Label>
                            <Select value={newVendorId} onValueChange={setNewVendorId}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Select a vendor" />
                                </SelectTrigger>
                                <SelectContent>
                                    {vendors.map((v: any) => (
                                        <SelectItem key={v.id} value={v.id}>{v.name}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <Label>Framework</Label>
                            <Select value={newFrameworkId} onValueChange={setNewFrameworkId}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Select a framework" />
                                </SelectTrigger>
                                <SelectContent>
                                    {frameworks.map((f: any) => (
                                        <SelectItem key={f.id} value={f.id}>{f.name} ({f.version})</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button onClick={handleCreate} disabled={createAssessment.isPending}>
                            {createAssessment.isPending ? "Creating..." : "Create Assessment"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
