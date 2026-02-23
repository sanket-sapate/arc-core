import { type MetaFunction } from "react-router";
import { useAssessments } from "~/features/tprm/api/assessments";
import { useVendors } from "~/features/tprm/api/vendors";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "~/components/ui/table";
import { Badge } from "~/components/ui/badge";
import { ClipboardList, CalendarClock } from "lucide-react";
import { format, isPast } from "date-fns";

export const meta: MetaFunction = () => {
    return [
        { title: "Assessments | ARC TPRM" },
        { name: "description", content: "Vendor risk assessments" },
    ];
};

export default function AssessmentsPage() {
    const { data: assessmentsData, isLoading: isLoadingAssessments } = useAssessments();
    const { data: vendorsData, isLoading: isLoadingVendors } = useVendors();

    // Use safe array mappings as requested
    const assessments = Array.isArray(assessmentsData) ? assessmentsData : (assessmentsData as any)?.data || [];
    const vendors = Array.isArray(vendorsData) ? vendorsData : (vendorsData as any)?.data || [];

    const getVendorName = (vendorId: string) => {
        if (!vendorId) return "No Vendor Selected";
        const vendor = vendors.find((v: any) => v.id === vendorId);
        return vendor ? vendor.name : "Unknown Vendor";
    };

    const getStatusBadge = (status: string) => {
        switch (status) {
            case "completed": return <Badge className="bg-green-100 text-green-800 hover:bg-green-100">Completed</Badge>;
            case "approved": return <Badge className="bg-emerald-100 text-emerald-800 hover:bg-emerald-100">Approved</Badge>;
            case "in_progress": return <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-100">In Progress</Badge>;
            case "under_review": return <Badge className="bg-amber-100 text-amber-800 hover:bg-amber-100">Under Review</Badge>;
            case "rejected": return <Badge variant="destructive">Rejected</Badge>;
            case "needs_remediation": return <Badge variant="destructive">Needs Remediation</Badge>;
            default: return <Badge variant="outline">Pending</Badge>;
        }
    };

    const isLoading = isLoadingAssessments || isLoadingVendors;

    return (
        <div className="flex-1 space-y-6 p-8 pt-6 max-w-7xl mx-auto">
            <div className="flex items-center justify-between space-y-2">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight">Assessments Dashboard</h2>
                    <p className="text-muted-foreground mt-1 text-sm">Create, track, and review vendor risk assessments</p>
                </div>
            </div>

            <div className="rounded-md border bg-card">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Assessment Title</TableHead>
                            <TableHead>Vendor</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead className="text-right">Due Date / Completion</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {isLoading ? (
                            <TableRow>
                                <TableCell colSpan={4} className="h-24 text-center">Loading assessments...</TableCell>
                            </TableRow>
                        ) : assessments.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={4} className="h-24 text-center">No assessments found.</TableCell>
                            </TableRow>
                        ) : (
                            assessments.map((assessment: any) => {
                                const isExpired = assessment.due_date ? isPast(new Date(assessment.due_date)) && !["completed", "approved"].includes(assessment.status) : false;
                                return (
                                    <TableRow key={assessment.id} className="cursor-pointer hover:bg-muted/50">
                                        <TableCell className="font-medium">
                                            <div className="flex items-center gap-2">
                                                <ClipboardList className="h-4 w-4 text-primary" />
                                                <span>{assessment.name || assessment.title || "Vendor Assessment"}</span>
                                            </div>
                                        </TableCell>
                                        <TableCell className="text-muted-foreground">
                                            {getVendorName(assessment.vendor_id)}
                                        </TableCell>
                                        <TableCell>
                                            {getStatusBadge(assessment.status)}
                                        </TableCell>
                                        <TableCell className="text-right text-muted-foreground text-sm">
                                            {assessment.due_date ? (
                                                <span className={`flex items-center justify-end gap-1.5 ${isExpired ? 'text-red-600 font-medium' : ''}`}>
                                                    <CalendarClock className="w-3.5 h-3.5" />
                                                    {format(new Date(assessment.due_date), "MMM d, yyyy")}
                                                </span>
                                            ) : (assessment.completed_at ? (
                                                <span className="flex items-center justify-end gap-1.5 text-green-600 font-medium">
                                                    {format(new Date(assessment.completed_at), "MMM d, yyyy")}
                                                </span>
                                            ) : "No Deadline")}
                                        </TableCell>
                                    </TableRow>
                                )
                            })
                        )}
                    </TableBody>
                </Table>
            </div>
        </div>
    );
}
