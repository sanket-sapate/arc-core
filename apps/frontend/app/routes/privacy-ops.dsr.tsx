import { useState } from "react";
import { usePrivacyRequests, useUpdatePrivacyRequestStatus } from "../features/ops/api/dsrs";
import { type PrivacyRequest } from "../features/ops/types/dsr";
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
import { Search, UserCircle, Clock } from "lucide-react";
import { format } from "date-fns";

const DSR_STATUS_OPTIONS = [
    { value: "pending", label: "Pending" },
    { value: "in_progress", label: "In Progress" },
    { value: "resolved", label: "Resolved" },
    { value: "rejected", label: "Rejected" },
];

export default function DSRPage() {
    const { data: requests, isLoading } = usePrivacyRequests();
    const updateStatusMutation = useUpdatePrivacyRequestStatus();
    const [searchTerm, setSearchTerm] = useState("");

    const [isSheetOpen, setIsSheetOpen] = useState(false);
    const [selectedRequest, setSelectedRequest] = useState<PrivacyRequest | undefined>(undefined);

    const filteredRequests = (Array.isArray(requests) ? requests : []).filter((r: PrivacyRequest) =>
        r.requester_email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        r.type.toLowerCase().includes(searchTerm.toLowerCase()) ||
        r.id.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const getStatusBadge = (status: string) => {
        switch (status) {
            case "resolved": return <Badge className="bg-green-100 text-green-800">Resolved</Badge>;
            case "rejected": return <Badge variant="destructive">Rejected</Badge>;
            case "in_progress": return <Badge className="bg-blue-100 text-blue-800">In Progress</Badge>;
            default: return <Badge variant="outline">Pending</Badge>;
        }
    };

    const handleRowClick = (req: PrivacyRequest) => {
        setSelectedRequest(req);
        setIsSheetOpen(true);
    };

    const handleStatusChange = (newStatus: string) => {
        if (!selectedRequest) return;
        updateStatusMutation.mutate({
            id: selectedRequest.id,
            payload: { status: newStatus }
        }, {
            onSuccess: () => {
                // Update local state to reflect change instantly in the sheet without closing it
                setSelectedRequest(prev => prev ? { ...prev, status: newStatus } : undefined);
            }
        });
    };

    // Prepare fields for the details sheet
    const sheetFields = selectedRequest ? [
        { label: "Request ID", value: <span className="font-mono text-xs">{selectedRequest.id}</span> },
        { label: "Request Type", value: <Badge variant="secondary" className="capitalize">{selectedRequest.type.replace("_", " ")}</Badge> },
        { label: "Requester Name", value: selectedRequest.requester_name },
        { label: "Requester Email", value: selectedRequest.requester_email },
        { label: "Description / Details", value: <p className="whitespace-pre-wrap">{selectedRequest.description}</p> },
        { label: "Resolution", value: selectedRequest.resolution },
    ] : [];

    return (
        <div className="p-8 max-w-7xl mx-auto space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Data Subject Requests</h1>
                    <p className="text-muted-foreground mt-1 text-sm">
                        Manage DSARs (Access, Deletion, Portability) to fulfill user privacy rights.
                    </p>
                </div>
            </div>

            <div className="flex items-center space-x-2 w-full max-w-sm">
                <Search className="w-4 h-4 text-muted-foreground absolute ml-3" />
                <Input
                    placeholder="Search by email, type, or ID..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-9"
                />
            </div>

            <div className="rounded-md border bg-card">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Requester</TableHead>
                            <TableHead>Type</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Created</TableHead>
                            <TableHead className="text-right">SLA Due Date</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {isLoading ? (
                            <TableRow>
                                <TableCell colSpan={5} className="h-24 text-center">Loading requests...</TableCell>
                            </TableRow>
                        ) : filteredRequests.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={5} className="h-24 text-center">No subject requests found.</TableCell>
                            </TableRow>
                        ) : (
                            (filteredRequests || []).map((req: PrivacyRequest) => (
                                <TableRow
                                    key={req.id}
                                    className="cursor-pointer hover:bg-muted/50"
                                    onClick={() => handleRowClick(req)}
                                >
                                    <TableCell className="font-medium">
                                        <div className="flex items-center gap-2">
                                            <UserCircle className="h-4 w-4 text-primary" />
                                            <div className="flex flex-col">
                                                <span>{req.requester_name || "Unknown"}</span>
                                                <span className="text-xs text-muted-foreground">{req.requester_email || "No email"}</span>
                                            </div>
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <Badge variant="secondary" className="capitalize">{req.type.replace("_", " ")}</Badge>
                                    </TableCell>
                                    <TableCell>{getStatusBadge(req.status)}</TableCell>
                                    <TableCell className="text-muted-foreground text-sm">
                                        {format(new Date(req.created_at), "MMM d, yyyy")}
                                    </TableCell>
                                    <TableCell className="text-right text-sm">
                                        {req.due_date ? (
                                            <span className="flex items-center justify-end gap-1.5 text-amber-600 font-medium">
                                                <Clock className="w-3.5 h-3.5" />
                                                {format(new Date(req.due_date), "MMM d, yyyy")}
                                            </span>
                                        ) : "None"}
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </div>

            {selectedRequest && (
                <RequestDetailsSheet
                    open={isSheetOpen}
                    onOpenChange={setIsSheetOpen}
                    title="Data Subject Request"
                    description="Review details and update the status of this request."
                    fields={sheetFields}
                    status={selectedRequest.status}
                    statusOptions={DSR_STATUS_OPTIONS}
                    onStatusChange={handleStatusChange}
                    isUpdatingStatus={updateStatusMutation.isPending}
                    createdAt={selectedRequest.created_at}
                    dueDate={selectedRequest.due_date}
                />
            )}
        </div>
    );
}
