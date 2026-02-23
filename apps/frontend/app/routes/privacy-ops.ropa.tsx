import { useState } from "react";
import { useROPAs } from "../features/ops/api/ropas";
import { type ROPA } from "../features/ops/types/ropa";
import { ROPAEditor } from "../features/ops/components/ROPAEditor";
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
import { Plus, Search, FileText } from "lucide-react";
import { format } from "date-fns";

export default function ROPAsPage() {
    const { data: ropas, isLoading } = useROPAs();
    const [searchTerm, setSearchTerm] = useState("");
    const [isSheetOpen, setIsSheetOpen] = useState(false);
    const [selectedROPA, setSelectedROPA] = useState<ROPA | undefined>(undefined);

    const filteredROPAs = (Array.isArray(ropas) ? ropas : []).filter(r =>
        r.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        r.processing_activity.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const getStatusBadge = (status: string) => {
        switch (status) {
            case "active": return <Badge className="bg-green-100 text-green-800">Active</Badge>;
            case "archived": return <Badge variant="secondary">Archived</Badge>;
            default: return <Badge variant="outline">Draft</Badge>;
        }
    };

    const handleNew = () => {
        setSelectedROPA(undefined);
        setIsSheetOpen(true);
    };

    const handleEdit = (ropa: ROPA) => {
        setSelectedROPA(ropa);
        setIsSheetOpen(true);
    };

    return (
        <div className="p-8 max-w-7xl mx-auto space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Records of Processing (ROPA)</h1>
                    <p className="text-muted-foreground mt-1 text-sm">
                        Maintain and monitor your organization's data processing activities for GDPR compliance.
                    </p>
                </div>
                <Button onClick={handleNew}>
                    <Plus className="mr-2 h-4 w-4" /> Add Record
                </Button>
            </div>

            <div className="flex items-center space-x-2 w-full max-w-sm">
                <Search className="w-4 h-4 text-muted-foreground absolute ml-3" />
                <Input
                    placeholder="Search records or processing activities..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-9"
                />
            </div>

            <div className="rounded-md border bg-card">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Record Name</TableHead>
                            <TableHead>Processing Activity</TableHead>
                            <TableHead>Legal Basis</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead className="text-right">Last Updated</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {isLoading ? (
                            <TableRow>
                                <TableCell colSpan={5} className="h-24 text-center">Loading records...</TableCell>
                            </TableRow>
                        ) : filteredROPAs.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={5} className="h-24 text-center">No records found. Create one to get started.</TableCell>
                            </TableRow>
                        ) : (
                            (filteredROPAs || []).map((ropa) => (
                                <TableRow
                                    key={ropa.id}
                                    className="cursor-pointer hover:bg-muted/50"
                                    onClick={() => handleEdit(ropa)}
                                >
                                    <TableCell className="font-medium">
                                        <div className="flex items-center gap-2">
                                            <FileText className="h-4 w-4 text-primary" />
                                            {ropa.name}
                                        </div>
                                    </TableCell>
                                    <TableCell className="max-w-[300px] truncate text-muted-foreground">
                                        {ropa.processing_activity}
                                    </TableCell>
                                    <TableCell>{ropa.legal_basis}</TableCell>
                                    <TableCell>{getStatusBadge(ropa.status)}</TableCell>
                                    <TableCell className="text-right text-muted-foreground text-sm">
                                        {ropa.updated_at ? format(new Date(ropa.updated_at), "MMM d, yyyy") : "Never"}
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
                        <SheetTitle>{selectedROPA ? "Edit ROPA Record" : "Create New ROPA Record"}</SheetTitle>
                        <SheetDescription>
                            Configure the data processing activity details and categorizations.
                        </SheetDescription>
                    </SheetHeader>
                    {isSheetOpen && (
                        <ROPAEditor ropa={selectedROPA} onClose={() => setIsSheetOpen(false)} />
                    )}
                </SheetContent>
            </Sheet>
        </div>
    );
}
