import { useState } from "react";
import { type MetaFunction } from "react-router";
import { useAssessments, useCreateAssessment } from "../features/tprm/api/assessments";
import { useFrameworks } from "../features/tprm/api/frameworks";
import { useVendors } from "../features/tprm/api/vendors";
import { KanbanBoard } from "../features/tprm/components/KanbanBoard";
import { QuestionnaireRenderer } from "../features/tprm/components/QuestionnaireRenderer";
import { Button } from "~/components/ui/button";
import { Loader2, Plus } from "lucide-react";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "~/components/ui/sheet";
import { type Assessment } from "../features/tprm/types/assessment";

export const meta: MetaFunction = () => {
    return [
        { title: "Assessments | ARC TPRM" },
        { name: "description", content: "Manage vendor assessments via Kanban" },
    ];
};

export default function AssessmentsPage() {
    const { data: assessments, isLoading: loadingAssessments } = useAssessments();
    const { data: vendors, isLoading: loadingVendors } = useVendors();
    const { data: frameworks, isLoading: loadingFrameworks } = useFrameworks();

    const [selectedAssessment, setSelectedAssessment] = useState<Assessment | null>(null);

    return (
        <div className="flex-1 space-y-6 p-8 pt-6">
            <div className="flex items-center justify-between space-y-2">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight">Assessments Board</h2>
                    <p className="text-muted-foreground mt-1">Track and manage vendor risk assessments</p>
                </div>
                <div className="flex items-center space-x-2">
                    {/* Create new assessment would go here. A dialog to select vendor + framework */}
                    <Button>
                        <Plus className="mr-2 h-4 w-4" />
                        Initiate Assessment
                    </Button>
                </div>
            </div>

            {loadingAssessments || loadingVendors || loadingFrameworks ? (
                <div className="flex items-center justify-center p-24">
                    <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
                </div>
            ) : (
                <KanbanBoard
                    assessments={assessments || []}
                    onSelectAssessment={(assessment) => setSelectedAssessment(assessment)}
                />
            )}

            <Sheet open={!!selectedAssessment} onOpenChange={(open) => !open && setSelectedAssessment(null)}>
                <SheetContent className="sm:max-w-[700px] overflow-y-auto">
                    {selectedAssessment && (
                        <>
                            <SheetHeader className="pb-6 border-b mb-6">
                                <SheetTitle className="text-2xl">Assessment Questionnaire</SheetTitle>
                                <SheetDescription>
                                    Respond to the framework questions below. Progress is automatically tracked.
                                </SheetDescription>
                            </SheetHeader>
                            <QuestionnaireRenderer
                                assessmentId={selectedAssessment.id!}
                                frameworkId={selectedAssessment.framework_id}
                            />
                        </>
                    )}
                </SheetContent>
            </Sheet>
        </div>
    );
}
