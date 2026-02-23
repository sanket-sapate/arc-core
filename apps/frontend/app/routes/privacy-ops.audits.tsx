import { type MetaFunction } from "react-router";
import { usePrivacyAuditLogs } from "../features/ops/api/audits";
import { type PrivacyAuditLog } from "../features/ops/types/audit";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "~/components/ui/table";
import { Badge } from "~/components/ui/badge";
import { Activity, User, Database } from "lucide-react";
import { format } from "date-fns";

export const meta: MetaFunction = () => {
    return [
        { title: "Privacy Audit Logs | Privacy Ops" },
        { name: "description", content: "View the complete privacy audit trail." },
    ];
};

export default function PrivacyAuditsPage() {
    const { data: auditData, isLoading } = usePrivacyAuditLogs();

    // Defensive safe mapping to ensure we never crash on nulls or bad response shapes
    const logs = Array.isArray(auditData) ? auditData : ((auditData as any)?.data || []);

    const getActionBadge = (action: string) => {
        const a = action.toLowerCase();
        if (a.includes("create")) return <Badge className="bg-emerald-100 text-emerald-800 hover:bg-emerald-100 border-none px-2">{action}</Badge>;
        if (a.includes("delete") || a.includes("remove") || a.includes("revoke")) return <Badge variant="destructive" className="px-2">{action}</Badge>;
        if (a.includes("update") || a.includes("modify")) return <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-100 border-none px-2">{action}</Badge>;
        return <Badge variant="outline" className="px-2">{action}</Badge>;
    };

    return (
        <div className="p-8 max-w-7xl mx-auto space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Privacy Audit Log</h1>
                    <p className="text-muted-foreground mt-1 text-sm">
                        Comprehensive immutable record of privacy configuration events.
                    </p>
                </div>
            </div>

            <div className="rounded-md border bg-card">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Event Action</TableHead>
                            <TableHead>Target Entity</TableHead>
                            <TableHead>Actor / User</TableHead>
                            <TableHead className="text-right">Timestamp</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {isLoading ? (
                            <TableRow>
                                <TableCell colSpan={4} className="h-24 text-center text-muted-foreground">Fetching complete audit history...</TableCell>
                            </TableRow>
                        ) : logs.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={4} className="h-24 text-center text-muted-foreground">No privacy audit logs available.</TableCell>
                            </TableRow>
                        ) : (
                            logs.map((log: PrivacyAuditLog) => (
                                <TableRow key={log.id} className="hover:bg-muted/50 cursor-default">
                                    <TableCell className="font-medium">
                                        <div className="flex items-center gap-2">
                                            <Activity className="h-4 w-4 text-primary" />
                                            {getActionBadge(log.action)}
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex items-center gap-2 text-sm">
                                            <Database className="h-3.5 w-3.5 text-muted-foreground" />
                                            <span className="capitalize text-slate-700 dark:text-slate-300">{log.target_entity}</span>
                                            <span className="font-mono text-xs text-muted-foreground truncate max-w-[120px]">({log.target_id})</span>
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                            <User className="h-3.5 w-3.5" />
                                            {log.actor_email || "System/API"}
                                        </div>
                                    </TableCell>
                                    <TableCell className="text-right text-sm text-muted-foreground">
                                        {format(new Date(log.timestamp), "MMM d, yyyy HH:mm:ss")}
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
