import { useState } from "react";
import { useGrievances, useUpdateGrievanceStatus } from "../features/ops/api/grievances";
import { type Grievance } from "../features/ops/types/grievance";
import { RequestDetailsSheet } from "../features/ops/components/RequestDetailsSheet";
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
import { Search, AlertTriangle, AlertCircle, Hand } from "lucide-react";
import { format } from "date-fns";

const GRIEVANCE_STATUS_OPTIONS = [
    { value: "open", label: "Open" },
    { value: "in_progress", label: "In Progress" },
    { value: "resolved", label: "Resolved" },
    { value: "closed", label: "Closed" },
];

export default function GrievancesPage() {
    const { data: grievances, isLoading } = useGrievances();
    const updateStatusMutation = useUpdateGrievanceStatus();
    const [searchTerm, setSearchTerm] = useState("");

    const [isSheetOpen, setIsSheetOpen] = useState(false);
    const [selectedGrievance, setSelectedGrievance] = useState<Grievance | undefined>(undefined);

    const filteredGrievances = (Array.isArray(grievances) ? grievances : []).filter((g: Grievance) =>
        g.reporter_email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        g.issue_type.toLowerCase().includes(searchTerm.toLowerCase()) ||
        g.id.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const getStatusBadge = (status: string) => {
        switch (status) {
            case "resolved": return <Badge className="bg-green-100 text-green-800">Resolved</Badge>;
            case "closed": return <Badge variant="secondary">Closed</Badge>;
            case "in_progress": return <Badge className="bg-blue-100 text-blue-800">In Progress</Badge>;
            default: return <Badge variant="outline">Open</Badge>;
        }
    };

    const getPriorityBadge = (priority: string) => {
        switch (priority) {
            case "high": return <span className="flex items-center text-orange-600 font-medium text-xs"><AlertTriangle className="h-3.5 w-3.5 mr-1" /> High</span>;
            case "critical": return <span className="flex items-center text-red-600 font-bold text-xs"><AlertCircle className="h-3.5 w-3.5 mr-1" /> Critical</span>;
            case "low": return <span className="text-muted-foreground text-xs">Low</span>;
            default: return <span className="text-muted-foreground text-xs font-medium">Medium</span>;
        }
    };

    const handleRowClick = (g: Grievance) => {
        setSelectedGrievance(g);
        setIsSheetOpen(true);
    };

    const handleStatusChange = (newStatus: string) => {
        if (!selectedGrievance) return;
        updateStatusMutation.mutate({
            id: selectedGrievance.id,
            payload: { status: newStatus }
        }, {
            onSuccess: () => {
                // Update local state to reflect change instantly in the sheet
                setSelectedGrievance(prev => prev ? { ...prev, status: newStatus } : undefined);
            }
        });
    };

    // Prepare fields for the details sheet
    const sheetFields = selectedGrievance ? [
        { label: "Grievance ID", value: <span className="font-mono text-xs">{selectedGrievance.id}</span> },
        { label: "Issue Type", value: <Badge variant="secondary">{selectedGrievance.issue_type.replace(/_/g, " ")}</Badge> },
        { label: "Priority", value: getPriorityBadge(selectedGrievance.priority) },
        { label: "Reporter", value: selectedGrievance.reporter_email || <span className="italic">Anonymous</span> },
        { label: "Description / Details", value: <p className="whitespace-pre-wrap">{selectedGrievance.description}</p> },
        { label: "Resolution Notes", value: selectedGrievance.resolution },
    ] : [];

    return (
        <div className="p-8 max-w-7xl mx-auto space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Privacy Grievances</h1>
                    <p className="text-muted-foreground mt-1 text-sm">
                        Track, investigate, and resolve privacy complaints and data breaches reported by users or employees.
                    </p>
                </div>
            </div>

            <div className="flex items-center space-x-2 w-full max-w-sm">
                <Search className="w-4 h-4 text-muted-foreground absolute ml-3" />
                <Input
                    placeholder="Search by email, issue type, or ID..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-9"
                />
            </div>

            <div className="rounded-md border bg-card">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Issue Type</TableHead>
                            <TableHead>Reporter</TableHead>
                            <TableHead>Priority</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead className="text-right">Reported On</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {isLoading ? (
                            <TableRow>
                                <TableCell colSpan={5} className="h-24 text-center">Loading grievances...</TableCell>
                            </TableRow>
                        ) : filteredGrievances.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={5} className="h-24 text-center">No privacy grievances found.</TableCell>
                            </TableRow>
                        ) : (
                            (filteredGrievances || []).map((g: Grievance) => (
                                <TableRow
                                    key={g.id}
                                    className="cursor-pointer hover:bg-muted/50"
                                    onClick={() => handleRowClick(g)}
                                >
                                    <TableCell className="font-medium">
                                        <div className="flex items-center gap-2">
                                            <Hand className="h-4 w-4 text-primary" />
                                            <span className="capitalize">{g.issue_type.replace(/_/g, " ")}</span>
                                        </div>
                                    </TableCell>
                                    <TableCell className="text-muted-foreground">
                                        {g.reporter_email || <span className="italic">Anonymous</span>}
                                    </TableCell>
                                    <TableCell>
                                        {getPriorityBadge(g.priority)}
                                    </TableCell>
                                    <TableCell>{getStatusBadge(g.status)}</TableCell>
                                    <TableCell className="text-right text-muted-foreground text-sm">
                                        {format(new Date(g.created_at), "MMM d, yyyy")}
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </div>

            {selectedGrievance && (
                <RequestDetailsSheet
                    open={isSheetOpen}
                    onOpenChange={setIsSheetOpen}
                    title="Privacy Grievance"
                    description="Review the incident details and advance the resolution workflow."
                    fields={sheetFields}
                    status={selectedGrievance.status}
                    statusOptions={GRIEVANCE_STATUS_OPTIONS}
                    onStatusChange={handleStatusChange}
                    isUpdatingStatus={updateStatusMutation.isPending}
                    createdAt={selectedGrievance.created_at}
                />
            )}
        </div>
    );
}
