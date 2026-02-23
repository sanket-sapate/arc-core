import { useMemo } from "react";
import { type Assessment } from "../types/assessment";
import { useUpdateAssessmentStatus } from "../api/assessments";
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "~/components/ui/card";
import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";
import { format } from "date-fns";
import { MoreHorizontal, FileText, ArrowRight } from "lucide-react";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "~/components/ui/dropdown-menu";

interface KanbanBoardProps {
    assessments: Assessment[];
    onSelectAssessment: (assessment: Assessment) => void;
}

const COLUMNS = [
    { id: "draft", label: "Draft", color: "bg-slate-100 dark:bg-slate-800" },
    { id: "in_progress", label: "In Progress", color: "bg-blue-50 dark:bg-blue-900/20" },
    { id: "under_review", label: "Under Review", color: "bg-amber-50 dark:bg-amber-900/20" },
    { id: "completed", label: "Completed", color: "bg-green-50 dark:bg-green-900/20" },
] as const;

export function KanbanBoard({ assessments, onSelectAssessment }: KanbanBoardProps) {
    const updateStatus = useUpdateAssessmentStatus();

    const grouped = useMemo(() => {
        const groups: Record<string, Assessment[]> = {
            draft: [],
            in_progress: [],
            under_review: [],
            completed: [],
        };
        assessments.forEach((a) => {
            const status = a.status || "draft";
            if (groups[status]) {
                groups[status].push(a);
            } else {
                groups["draft"].push(a); // Fallback
            }
        });
        return groups;
    }, [assessments]);

    // Format utility for badges and states
    const getScoreBadge = (score?: number | null) => {
        if (score === null || score === undefined) return null;
        if (score >= 80) return <Badge className="bg-green-500/15 text-green-700 hover:bg-green-500/25 border-green-200">Score: {score}%</Badge>;
        if (score >= 60) return <Badge className="bg-amber-500/15 text-amber-700 hover:bg-amber-500/25 border-amber-200">Score: {score}%</Badge>;
        return <Badge className="bg-red-500/15 text-red-700 hover:bg-red-500/25 border-red-200">Score: {score}%</Badge>;
    };

    return (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-start w-full overflow-x-auto pb-4">
            {COLUMNS.map((col) => (
                <div key={col.id} className={`flex flex-col rounded-lg border p-4 ${col.color} min-w-[300px]`}>
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="font-semibold text-sm uppercase tracking-wider">{col.label}</h3>
                        <Badge variant="secondary" className="rounded-full">
                            {grouped[col.id].length}
                        </Badge>
                    </div>

                    <div className="flex flex-col gap-3">
                        {grouped[col.id].map((assessment) => (
                            <Card key={assessment.id} className="cursor-pointer hover:shadow-md transition-shadow border-slate-200 shadow-sm" onClick={() => onSelectAssessment(assessment)}>
                                <CardHeader className="p-4 pb-2 flex flex-row items-start justify-between">
                                    <div className="space-y-1">
                                        <CardTitle className="text-sm font-medium leading-none flex items-center gap-2">
                                            <FileText className="w-4 h-4 text-muted-foreground" />
                                            {/* We rely on the parent or API to attach the Vendor/Framework Names if doing joins, otherwise we show the ID for now or user solves joining logic up the tree */}
                                            Assessment #{assessment.id?.substring(0, 8)}
                                        </CardTitle>
                                    </div>
                                    <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                            <Button variant="ghost" className="h-8 w-8 p-0" onClick={(e) => e.stopPropagation()}>
                                                <span className="sr-only">Open menu</span>
                                                <MoreHorizontal className="h-4 w-4" />
                                            </Button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent align="end">
                                            <DropdownMenuItem onSelect={(e) => { e.preventDefault(); onSelectAssessment(assessment); }}>
                                                View Details
                                            </DropdownMenuItem>
                                            <DropdownMenuSeparator />
                                            <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground">Move to...</div>
                                            {COLUMNS.filter(c => c.id !== col.id).map(targetCol => (
                                                <DropdownMenuItem
                                                    key={targetCol.id}
                                                    onSelect={(e) => {
                                                        e.preventDefault();
                                                        if (assessment.id) updateStatus.mutate({ id: assessment.id, status: targetCol.id });
                                                    }}
                                                >
                                                    <ArrowRight className="w-4 h-4 mr-2 text-muted-foreground" />
                                                    {targetCol.label}
                                                </DropdownMenuItem>
                                            ))}
                                        </DropdownMenuContent>
                                    </DropdownMenu>
                                </CardHeader>
                                <CardContent className="p-4 pt-0">
                                    <div className="flex items-center justify-between mt-2">
                                        {getScoreBadge(assessment.score)}
                                        <p className="text-xs text-muted-foreground">
                                            {assessment.updated_at ? format(new Date(assessment.updated_at), "MMM d, yyyy") : ""}
                                        </p>
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                        {grouped[col.id].length === 0 && (
                            <div className="p-4 border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-lg text-center text-sm text-muted-foreground">
                                No assessments
                            </div>
                        )}
                    </div>
                </div>
            ))}
        </div>
    );
}
