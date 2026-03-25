import { useState } from "react";
import { useDPIAs } from "../features/ops/api/dpias";
import { type DPIA } from "../features/ops/types/dpia";
import { DPIAEditor } from "../features/ops/components/DPIAEditor";
import { Button } from "~/components/ui/button";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "~/components/ui/table";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "~/components/ui/sheet";
import { Badge } from "~/components/ui/badge";
import { Input } from "~/components/ui/input";
import { Plus, Search, ShieldAlert } from "lucide-react";
import { format } from "date-fns";
import { useVendors } from "~/features/tprm/api/vendors";

export default function DPIAsPage() {
    const { data: dpias, isLoading } = useDPIAs();
    const { data: vendors } = useVendors();
    const [searchTerm, setSearchTerm] = useState("");
    const [isSheetOpen, setIsSheetOpen] = useState(false);
    const [selectedDPIA, setSelectedDPIA] = useState<DPIA | undefined>(undefined);

    const filteredDPIAs = (Array.isArray(dpias) ? dpias : []).filter(d =>
        d.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const getStatusBadge = (status: string) => {
        switch (status) {
            case "approved": return <Badge className="bg-green-100 text-green-800">Approved</Badge>;
            case "rejected": return <Badge variant="destructive">Rejected</Badge>;
            case "in_progress": return <Badge className="bg-blue-100 text-blue-800">In Progress</Badge>;
            case "under_review": return <Badge className="bg-amber-100 text-amber-800">Under Review</Badge>;
            default: return <Badge variant="outline">Draft</Badge>;
        }
    };

    const getRiskBadge = (level: string) => {
        switch (level) {
            case "low": return <Badge variant="outline" className="text-muted-foreground">Low</Badge>;
            case "medium": return <Badge className="bg-yellow-100 text-yellow-800 hover:bg-yellow-100">Medium</Badge>;
            case "high": return <Badge className="bg-orange-100 text-orange-800 hover:bg-orange-100">High</Badge>;
            case "critical": return <Badge className="bg-red-100 text-red-800 hover:bg-red-100">Critical</Badge>;
            default: return null;
        }
    };

    const handleNew = () => {
        setSelectedDPIA(undefined);
        setIsSheetOpen(true);
    };

    const handleEdit = (dpia: DPIA) => {
        setSelectedDPIA(dpia);
        setIsSheetOpen(true);
    };

    const getVendorName = (vendorId?: string | null) => {
        if (!vendorId || !vendors) return "Internal Form";
        return vendors.find(v => v.id === vendorId)?.name || "Unknown Vendor";
    };

    return (
        <div className="p-8 max-w-7xl mx-auto space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Data Protection Impact Assessments</h1>
                    <p className="text-muted-foreground mt-1 text-sm">
                        Evaluate, manage, and mitigate privacy risks for internal projects and third-party vendors.
                    </p>
                </div>
                <Button onClick={handleNew}>
                    <Plus className="mr-2 h-4 w-4" /> New Assessment
                </Button>
            </div>

            <div className="flex items-center space-x-2 w-full max-w-sm">
                <Search className="w-4 h-4 text-muted-foreground absolute ml-3" />
                <Input
                    placeholder="Search by project name..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-9"
                />
            </div>

            <div className="rounded-md border bg-card">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Project / Assessment Name</TableHead>
                            <TableHead>Related Vendor</TableHead>
                            <TableHead>Risk Level</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead className="text-right">Last Updated</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {isLoading ? (
                            <TableRow>
                                <TableCell colSpan={5} className="h-24 text-center">Loading assessments...</TableCell>
                            </TableRow>
                        ) : filteredDPIAs.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={5} className="h-24 text-center">No assessments found. Start a new evaluation.</TableCell>
                            </TableRow>
                        ) : (
                            (filteredDPIAs || []).map((dpia) => (
                                <TableRow
                                    key={dpia.id}
                                    className="cursor-pointer hover:bg-muted/50"
                                    onClick={() => handleEdit(dpia)}
                                >
                                    <TableCell className="font-medium">
                                        <div className="flex items-center gap-2">
                                            <ShieldAlert className="h-4 w-4 text-primary" />
                                            {dpia.name}
                                        </div>
                                    </TableCell>
                                    <TableCell className="text-muted-foreground">
                                        {getVendorName(dpia.vendor_id)}
                                    </TableCell>
                                    <TableCell>{getRiskBadge(dpia.risk_level)}</TableCell>
                                    <TableCell>{getStatusBadge(dpia.status)}</TableCell>
                                    <TableCell className="text-right text-muted-foreground text-sm">
                                        {dpia.updated_at ? format(new Date(dpia.updated_at), "MMM d, yyyy") : "Never"}
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </div>

            <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
                <SheetContent className="sm:max-w-xl overflow-y-auto">
                    <SheetHeader className="mb-6">
                        <SheetTitle>{selectedDPIA ? "Edit DPIA" : "Create New DPIA"}</SheetTitle>
                        <SheetDescription>
                            Assess internal or vendor-driven workflows for GDPR data protection risks.
                        </SheetDescription>
                    </SheetHeader>
                    {isSheetOpen && (
                        <DPIAEditor dpia={selectedDPIA} onClose={() => setIsSheetOpen(false)} />
                    )}
                </SheetContent>
            </Sheet>
        </div>
    );
}
