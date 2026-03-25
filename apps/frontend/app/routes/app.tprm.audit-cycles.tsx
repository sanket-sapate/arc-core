import { type MetaFunction } from "react-router";
import { useAuditCycles } from "../features/tprm/api/audit-cycles";
import { Card, CardHeader, CardTitle, CardContent } from "~/components/ui/card";
import { Button } from "~/components/ui/button";
import { Badge } from "~/components/ui/badge";
import { Loader2, Plus, Calendar } from "lucide-react";
import { format } from "date-fns";

export const meta: MetaFunction = () => {
    return [
        { title: "Audit Cycles | ARC TPRM" },
        { name: "description", content: "Manage vendor audit cycles" },
    ];
};

export default function AuditCyclesPage() {
    const { data: cycles, isLoading } = useAuditCycles();

    const getStatusColor = (status: string) => {
        switch (status) {
            case "active":
                return "default";
            case "planned":
                return "secondary";
            case "closed":
                return "outline";
            default:
                return "default";
        }
    };

    return (
        <div className="flex-1 space-y-6 p-8 pt-6">
            <div className="flex items-center justify-between space-y-2">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight">Audit Cycles</h2>
                    <p className="text-muted-foreground mt-1">Organize vendor assessments into distinct time-bound cycles.</p>
                </div>
                <div className="flex items-center space-x-2">
                    <Button>
                        <Plus className="mr-2 h-4 w-4" />
                        Create Cycle
                    </Button>
                </div>
            </div>

            {isLoading ? (
                <div className="flex items-center justify-center p-24">
                    <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
                </div>
            ) : (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {cycles?.map((cycle) => (
                        <Card key={cycle.id} className="cursor-pointer hover:shadow-md transition-shadow">
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 border-b mb-4">
                                <CardTitle className="text-lg font-medium truncate pr-4">
                                    {cycle.name}
                                </CardTitle>
                                <Badge variant={getStatusColor(cycle.status || "planned")} className="capitalize">
                                    {cycle.status}
                                </Badge>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="flex items-center text-sm">
                                    <Calendar className="mr-2 h-4 w-4 text-muted-foreground" />
                                    <span className="text-muted-foreground mr-2">Start:</span>
                                    <span className="font-medium">
                                        {cycle.start_date ? format(new Date(cycle.start_date), "MMM d, yyyy") : "-"}
                                    </span>
                                </div>
                                <div className="flex items-center text-sm">
                                    <Calendar className="mr-2 h-4 w-4 text-muted-foreground" />
                                    <span className="text-muted-foreground mr-2">End:</span>
                                    <span className="font-medium">
                                        {cycle.end_date ? format(new Date(cycle.end_date), "MMM d, yyyy") : "-"}
                                    </span>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                    {(!cycles || cycles.length === 0) && (
                        <div className="col-span-full border-2 border-dashed rounded-lg p-12 text-center">
                            <Calendar className="h-10 w-10 text-muted-foreground mx-auto mb-4 opacity-50" />
                            <h3 className="text-lg font-semibold">No audit cycles configured</h3>
                            <p className="text-muted-foreground mt-2">Create an audit cycle to begin assigning assessments.</p>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
