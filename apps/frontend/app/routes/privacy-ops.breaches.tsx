import { useState } from "react";
import { type MetaFunction } from "react-router";
import { useBreaches } from "../features/ops/api/breaches";
import type { Breach } from "../features/ops/types/breach";
import { BreachReporterSheet } from "../features/ops/components/BreachReporterSheet";
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
import { AlertCircle, Plus } from "lucide-react";
import { format } from "date-fns";

export const meta: MetaFunction = () => {
    return [
        { title: "Incident & Breach Management | Privacy Ops" },
        { name: "description", content: "Track and manage privacy incidents and data breaches." },
    ];
};

export default function BreachesPage() {
    const { data: breachesData, isLoading } = useBreaches();

    // Safely coalesce array
    const breaches = Array.isArray(breachesData) ? breachesData : ((breachesData as any)?.data || []);

    const [isSheetOpen, setIsSheetOpen] = useState(false);
    const [selectedBreach, setSelectedBreach] = useState<Breach | undefined>(undefined);

    const handleRowClick = (breach: Breach) => {
        setSelectedBreach(breach);
        setIsSheetOpen(true);
    };

    const handleCreateNew = () => {
        setSelectedBreach(undefined);
        setIsSheetOpen(true);
    };

    const getSeverityBadge = (severity: string) => {
        const s = severity?.toLowerCase() || "";
        if (s === "critical" || s === "high") return <Badge variant="destructive" className="capitalize">{severity}</Badge>;
        if (s === "medium") return <Badge variant="secondary" className="bg-amber-100 text-amber-800 hover:bg-amber-100 capitalize">{severity}</Badge>;
        return <Badge variant="outline" className="capitalize">{severity}</Badge>;
    };

    const getStatusBadge = (status: string) => {
        const s = status?.toLowerCase() || "";
        if (s === "resolved" || s === "closed") return <Badge className="bg-emerald-100 text-emerald-800 hover:bg-emerald-100 border-none capitalize">{status}</Badge>;
        if (s === "contained") return <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-100 border-none capitalize">{status}</Badge>;
        return <Badge variant="outline" className="capitalize">{status}</Badge>;
    };

    return (
        <div className="p-8 max-w-7xl mx-auto space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Incident Management</h1>
                    <p className="text-muted-foreground mt-1 text-sm">
                        Log, investigate, and remediate data privacy and security breaches.
                    </p>
                </div>
                <Button onClick={handleCreateNew}>
                    <Plus className="mr-2 h-4 w-4" /> Report New Breach
                </Button>
            </div>

            <div className="rounded-md border bg-card">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Incident Title</TableHead>
                            <TableHead>Severity</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead className="text-right">Discovery Date</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {isLoading ? (
                            <TableRow>
                                <TableCell colSpan={4} className="h-24 text-center text-muted-foreground">Loading incidents...</TableCell>
                            </TableRow>
                        ) : breaches.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={4} className="h-24 text-center text-muted-foreground">No data breaches reported.</TableCell>
                            </TableRow>
                        ) : (
                            breaches.map((breach: Breach) => (
                                <TableRow
                                    key={breach.id}
                                    className="cursor-pointer hover:bg-muted/50"
                                    onClick={() => handleRowClick(breach)}
                                >
                                    <TableCell className="font-medium">
                                        <div className="flex items-center gap-2">
                                            <AlertCircle className="h-4 w-4 text-destructive" />
                                            <span>{breach.title}</span>
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        {getSeverityBadge(breach.severity)}
                                    </TableCell>
                                    <TableCell>
                                        {getStatusBadge(breach.status)}
                                    </TableCell>
                                    <TableCell className="text-right text-sm text-muted-foreground">
                                        {breach.incident_date ? format(new Date(breach.incident_date), "MMM d, yyyy") : "N/A"}
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </div>

            <BreachReporterSheet
                open={isSheetOpen}
                onOpenChange={setIsSheetOpen}
                initialData={selectedBreach}
            />
        </div>
    );
}
