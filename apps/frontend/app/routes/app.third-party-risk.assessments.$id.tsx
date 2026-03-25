import { useParams, useNavigate, type MetaFunction } from "react-router";
import { useAssessment } from "~/features/tprm/api/assessments";
import { useVendors } from "~/features/tprm/api/vendors";
import { useFramework } from "~/features/tprm/api/frameworks";
import { QuestionnaireRenderer } from "~/features/tprm/components/QuestionnaireRenderer";
import { useUpdateAssessmentStatus } from "~/features/tprm/api/assessments";
import { Button } from "~/components/ui/button";
import { Badge } from "~/components/ui/badge";
import { Skeleton } from "~/components/ui/skeleton";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "~/components/ui/select";
import { ArrowLeft, ClipboardList, Building2, BookOpen, CalendarClock } from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";

export const meta: MetaFunction = () => {
    return [
        { title: "Assessment | ARC TPRM" },
        { name: "description", content: "View and fill assessment questionnaire" },
    ];
};

const STATUS_OPTIONS = [
    { value: "draft", label: "Draft" },
    { value: "in_progress", label: "In Progress" },
    { value: "under_review", label: "Under Review" },
    { value: "completed", label: "Completed" },
];

const getStatusBadge = (status: string) => {
    switch (status) {
        case "completed": return <Badge className="bg-green-100 text-green-800 hover:bg-green-100">Completed</Badge>;
        case "in_progress": return <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-100">In Progress</Badge>;
        case "under_review": return <Badge className="bg-amber-100 text-amber-800 hover:bg-amber-100">Under Review</Badge>;
        default: return <Badge variant="outline">Draft</Badge>;
    }
};

export default function AssessmentDetailPage() {
    const { id } = useParams();
    const navigate = useNavigate();
    const { data: assessment, isLoading: isLoadingAssessment } = useAssessment(id || "");
    const { data: vendors } = useVendors();
    const { data: framework, isLoading: isLoadingFramework } = useFramework(assessment?.framework_id || "");
    const updateStatus = useUpdateAssessmentStatus();

    const vendor = (vendors || []).find((v: any) => v.id === assessment?.vendor_id);

    const handleStatusChange = (status: string) => {
        if (!id) return;
        updateStatus.mutate({ id, status }, {
            onSuccess: () => toast.success("Status updated"),
            onError: (err) => toast.error(err.message || "Failed to update status"),
        });
    };

    if (isLoadingAssessment) {
        return (
            <div className="flex-1 space-y-6 p-8 pt-6 max-w-5xl mx-auto">
                <Skeleton className="h-10 w-[200px]" />
                <Skeleton className="h-24 w-full" />
                <Skeleton className="h-[500px] w-full" />
            </div>
        );
    }

    if (!assessment) {
        return (
            <div className="flex-1 p-8 pt-6 max-w-5xl mx-auto text-center py-24">
                <ClipboardList className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
                <p className="text-muted-foreground text-lg">Assessment not found</p>
                <Button onClick={() => navigate("/app/third-party-risk/assessments")} className="mt-4">
                    Back to Assessments
                </Button>
            </div>
        );
    }

    return (
        <div className="flex-1 space-y-6 p-8 pt-6 max-w-5xl mx-auto">
            {/* Back button */}
            <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate("/app/third-party-risk/assessments")}
                className="gap-2 -ml-2"
            >
                <ArrowLeft className="h-4 w-4" />
                Back to Assessments
            </Button>

            {/* Header */}
            <div className="flex items-start justify-between gap-4">
                <div className="space-y-1">
                    <div className="flex items-center gap-3">
                        <ClipboardList className="h-8 w-8 text-primary" />
                        <div>
                            <h2 className="text-3xl font-bold tracking-tight">
                                {vendor?.name || "Unknown Vendor"}
                            </h2>
                            <p className="text-muted-foreground mt-0.5">
                                {isLoadingFramework ? "Loading framework..." : (framework?.name || "Unknown Framework")}
                                {framework?.version && (
                                    <span className="ml-1 text-xs">({framework.version})</span>
                                )}
                            </p>
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-3 shrink-0">
                    <Select
                        value={assessment.status}
                        onValueChange={handleStatusChange}
                        disabled={updateStatus.isPending}
                    >
                        <SelectTrigger className="w-[160px]">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            {STATUS_OPTIONS.map(opt => (
                                <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
            </div>

            {/* Meta info bar */}
            <div className="flex flex-wrap items-center gap-6 rounded-lg border bg-muted/30 px-5 py-3 text-sm text-muted-foreground">
                <div className="flex items-center gap-2">
                    <Building2 className="h-4 w-4" />
                    <span className="font-medium text-foreground">{vendor?.name || "—"}</span>
                </div>
                <div className="flex items-center gap-2">
                    <BookOpen className="h-4 w-4" />
                    <span>{framework?.name || "—"}</span>
                </div>
                <div className="flex items-center gap-2">
                    <CalendarClock className="h-4 w-4" />
                    <span>
                        Created {assessment.created_at ? format(new Date(assessment.created_at), "MMM d, yyyy") : "—"}
                    </span>
                </div>
                <div className="ml-auto">
                    {getStatusBadge(assessment.status)}
                </div>
            </div>

            {/* Questionnaire */}
            <QuestionnaireRenderer
                assessmentId={id!}
                frameworkId={assessment.framework_id}
            />
        </div>
    );
}
