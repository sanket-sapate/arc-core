import { useState, useMemo } from "react";
import { useFrameworkQuestions } from "../api/frameworks";
import { useAssessmentAnswers, useUpsertAssessmentAnswer } from "../api/assessments";
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "~/components/ui/card";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import { Switch } from "~/components/ui/switch";
import { Progress } from "~/components/ui/progress";
import { Loader2, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";

interface QuestionnaireRendererProps {
    assessmentId: string;
    frameworkId: string;
}

export function QuestionnaireRenderer({ assessmentId, frameworkId }: QuestionnaireRendererProps) {
    const { data: questions, isLoading: loadingQuestions } = useFrameworkQuestions(frameworkId);
    const { data: answers, isLoading: loadingAnswers } = useAssessmentAnswers(assessmentId);
    const upsertAnswer = useUpsertAssessmentAnswer();

    const [localAnswers, setLocalAnswers] = useState<Record<string, string>>({});

    const progress = useMemo(() => {
        if (!questions?.length) return 0;
        // Count answers that exist in DB or local state (if saved)
        // For simplicity, we just use DB answers as the source of truth for progress
        const answeredCount = answers?.filter(a => a.answer_text != null || a.answer_options != null).length || 0;
        return Math.round((answeredCount / questions.length) * 100);
    }, [questions, answers]);

    const handleSaveAnswer = async (questionId: string, value: string) => {
        try {
            await upsertAnswer.mutateAsync({
                assessmentId,
                payload: {
                    question_id: questionId,
                    answer_text: value
                }
            });
            toast.success("Answer saved");
        } catch (error) {
            toast.error("Failed to save answer");
        }
    };

    if (loadingQuestions || loadingAnswers) {
        return (
            <div className="flex flex-col items-center justify-center p-12 space-y-4">
                <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
                <p className="text-muted-foreground animate-pulse">Loading questionnaire...</p>
            </div>
        );
    }

    if (!questions || questions.length === 0) {
        return (
            <Card className="border-dashed shadow-none bg-muted/20">
                <CardContent className="p-12 text-center text-muted-foreground">
                    This framework currently has no questions defined.
                </CardContent>
            </Card>
        );
    }

    const getExistingAnswer = (qId: string) => {
        const found = answers?.find(a => a.question_id === qId);
        return found?.answer_text || "";
    };

    return (
        <div className="space-y-6">
            <Card className="bg-primary/5 border-primary/20">
                <CardContent className="p-4 flex items-center justify-between">
                    <div>
                        <h3 className="font-semibold text-primary">Assessment Progress</h3>
                        <p className="text-sm text-muted-foreground">{progress}% Completed</p>
                    </div>
                    <div className="w-1/2">
                        <Progress value={progress} className="h-3" />
                    </div>
                </CardContent>
            </Card>

            <div className="grid gap-6">
                {questions.map((q, index) => {
                    // Initialize local state with existing DB answer if not set
                    const currentValue = localAnswers[q.id!] !== undefined
                        ? localAnswers[q.id!]
                        : getExistingAnswer(q.id!);

                    const isSaved = getExistingAnswer(q.id!) === currentValue && currentValue !== "";

                    return (
                        <Card key={q.id} className={isSaved ? "border-green-200 bg-green-50/10" : ""}>
                            <CardHeader className="pb-3">
                                <div className="flex items-start justify-between">
                                    <CardTitle className="text-lg font-medium leading-relaxed">
                                        <span className="text-muted-foreground mr-2 font-normal">Q{index + 1}.</span>
                                        {q.question_text}
                                    </CardTitle>
                                    {isSaved && <CheckCircle2 className="w-5 h-5 text-green-500 flex-shrink-0" />}
                                </div>
                            </CardHeader>
                            <CardContent>
                                {q.question_type === 'boolean' ? (
                                    <div className="flex items-center space-x-2 mt-2">
                                        <Switch
                                            checked={currentValue === "true"}
                                            onCheckedChange={(checked) => {
                                                const val = checked ? "true" : "false";
                                                setLocalAnswers(prev => ({ ...prev, [q.id!]: val }));
                                            }}
                                        />
                                        <Label>{currentValue === "true" ? "Yes / Compliant" : "No / Non-Compliant"}</Label>
                                    </div>
                                ) : (
                                    <Input
                                        placeholder="Enter your response..."
                                        value={currentValue}
                                        onChange={(e) => setLocalAnswers(prev => ({ ...prev, [q.id!]: e.target.value }))}
                                        className="mt-2"
                                    />
                                )}
                            </CardContent>
                            <CardFooter className="pt-0 justify-end">
                                <Button
                                    size="sm"
                                    variant={isSaved ? "secondary" : "default"}
                                    onClick={() => handleSaveAnswer(q.id!, currentValue)}
                                    disabled={upsertAnswer.isPending || (currentValue === "" && !isSaved)}
                                >
                                    {upsertAnswer.isPending && upsertAnswer.variables?.payload.question_id === q.id ? (
                                        <Loader2 className="w-4 h-4 animate-spin mr-2" />
                                    ) : null}
                                    {isSaved ? "Update Answer" : "Save Answer"}
                                </Button>
                            </CardFooter>
                        </Card>
                    );
                })}
            </div>
        </div>
    );
}
