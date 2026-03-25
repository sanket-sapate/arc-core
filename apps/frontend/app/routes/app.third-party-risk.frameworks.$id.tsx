import { useState } from "react";
import { useParams, useNavigate, type MetaFunction } from "react-router";
import {
    useFramework,
    useFrameworkQuestions,
    useCreateFrameworkQuestion,
} from "~/features/tprm/api/frameworks";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { queryClient } from "~/lib/api";
import { Button } from "~/components/ui/button";
import { Label } from "~/components/ui/label";
import { Textarea } from "~/components/ui/textarea";
import { Badge } from "~/components/ui/badge";
import { Skeleton } from "~/components/ui/skeleton";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "~/components/ui/select";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "~/components/ui/dialog";
import { ArrowLeft, Plus, Upload, HelpCircle, MessageSquare } from "lucide-react";
import { ImportQuestionsModal } from "~/features/tprm/components/ImportQuestionsModal";

export const meta: MetaFunction = () => {
    return [
        { title: "Framework Questions | ARC TPRM" },
        { name: "description", content: "Manage framework assessment questions" },
    ];
};

export default function FrameworkDetailsPage() {
    const { id } = useParams();
    const navigate = useNavigate();
    const [isAddQuestionOpen, setIsAddQuestionOpen] = useState(false);
    const [isImportOpen, setIsImportOpen] = useState(false);

    const { data: framework, isLoading: isFrameworkLoading } = useFramework(id || "");
    const { data: questionsData, isLoading: isQuestionsLoading } = useFrameworkQuestions(id || "");
    const createQuestionMutation = useCreateFrameworkQuestion();

    const questionForm = useForm({
        defaultValues: { question_text: "", question_type: "text" as string }
    });

    const questions = Array.isArray(questionsData) ? questionsData : [];

    const onAddQuestion = async (formData: any) => {
        if (!id) return;
        
        try {
            await createQuestionMutation.mutateAsync({
                frameworkId: id,
                payload: {
                    question_text: formData.question_text,
                    question_type: formData.question_type,
                },
            });
            toast.success("Question added successfully!");
            questionForm.reset();
            setIsAddQuestionOpen(false);
        } catch (err: any) {
            toast.error(err.message || "Failed to add question");
        }
    };

    const getQuestionTypeBadge = (type: string) => {
        switch (type?.toLowerCase()) {
            case 'boolean': return <Badge className="bg-blue-500/15 text-blue-600 hover:bg-blue-500/25 border-none text-xs">Yes / No</Badge>;
            case 'multiple_choice': return <Badge className="bg-purple-500/15 text-purple-600 hover:bg-purple-500/25 border-none text-xs">Multiple Choice</Badge>;
            default: return <Badge variant="outline" className="text-xs">Free Text</Badge>;
        }
    };

    if (isFrameworkLoading) {
        return (
            <div className="flex-1 space-y-6 p-8 pt-6 max-w-7xl mx-auto">
                <Skeleton className="h-12 w-[300px]" />
                <Skeleton className="h-[400px] w-full" />
            </div>
        );
    }

    if (!framework) {
        return (
            <div className="flex-1 space-y-6 p-8 pt-6 max-w-7xl mx-auto">
                <div className="text-center py-12">
                    <p className="text-muted-foreground">Framework not found</p>
                    <Button onClick={() => navigate("/app/third-party-risk/frameworks")} className="mt-4">
                        Back to Frameworks
                    </Button>
                </div>
            </div>
        );
    }

    return (
        <div className="flex-1 space-y-6 p-8 pt-6 max-w-7xl mx-auto">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="space-y-1">
                    <div className="flex items-center gap-3">
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => navigate("/app/third-party-risk/frameworks")}
                            className="gap-2"
                        >
                            <ArrowLeft className="h-4 w-4" />
                            Back to Frameworks
                        </Button>
                    </div>
                    <div className="flex items-center gap-3 mt-2">
                        <MessageSquare className="h-8 w-8 text-primary" />
                        <div>
                            <h2 className="text-3xl font-bold tracking-tight">
                                {framework.name} <span className="text-muted-foreground text-xl">({framework.version})</span>
                            </h2>
                            {framework.description && (
                                <p className="text-muted-foreground mt-1">{framework.description}</p>
                            )}
                        </div>
                    </div>
                </div>

                <div className="flex gap-2">
                    <Button variant="outline" onClick={() => setIsImportOpen(true)}>
                        <Upload className="mr-2 h-4 w-4" />
                        Import CSV
                    </Button>
                    <Dialog open={isAddQuestionOpen} onOpenChange={setIsAddQuestionOpen}>
                        <DialogTrigger asChild>
                            <Button>
                                <Plus className="mr-2 h-4 w-4" />
                                Add Question
                            </Button>
                        </DialogTrigger>
                        <DialogContent>
                            <DialogHeader>
                                <DialogTitle>Add Question to {framework.name}</DialogTitle>
                                <DialogDescription>
                                    Define a new assessment question for this compliance framework.
                                </DialogDescription>
                            </DialogHeader>
                            <form onSubmit={questionForm.handleSubmit(onAddQuestion)} className="space-y-4">
                                <div className="space-y-2">
                                    <Label>Question Text</Label>
                                    <Textarea
                                        {...questionForm.register("question_text", { required: true })}
                                        placeholder="e.g. Does the vendor encrypt data at rest using AES-256 or equivalent?"
                                        rows={3}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label>Answer Type</Label>
                                    <Select
                                        defaultValue="text"
                                        onValueChange={(v) => questionForm.setValue("question_type", v)}
                                    >
                                        <SelectTrigger>
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="text">Free Text</SelectItem>
                                            <SelectItem value="boolean">Yes / No</SelectItem>
                                            <SelectItem value="multiple_choice">Multiple Choice</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <DialogFooter>
                                    <Button type="submit" disabled={createQuestionMutation.isPending}>
                                        {createQuestionMutation.isPending ? "Adding..." : "Add Question"}
                                    </Button>
                                </DialogFooter>
                            </form>
                        </DialogContent>
                    </Dialog>
                </div>
            </div>

            {/* Questions List */}
            <div className="rounded-md border bg-card p-6">
                <div className="mb-4">
                    <h3 className="text-lg font-semibold">Assessment Questions</h3>
                    <p className="text-sm text-muted-foreground mt-0.5">
                        Questions that vendors must answer when assessed against this framework
                    </p>
                </div>

                {isQuestionsLoading ? (
                    <div className="space-y-3">
                        {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-16 w-full" />)}
                    </div>
                ) : questions.length === 0 ? (
                    <div className="text-center py-12 text-muted-foreground">
                        <HelpCircle className="h-12 w-12 mx-auto mb-3 opacity-50" />
                        <p className="text-base font-medium">No questions added yet</p>
                        <p className="text-sm mt-1">Click "Add Question" or "Import CSV" to build out this framework's assessment.</p>
                    </div>
                ) : (
                    <div className="space-y-2">
                        {questions.map((q: any, idx: number) => (
                            <div key={q.id || idx} className="rounded-md border p-4 gap-4 hover:bg-muted/30 transition-colors">
                                <div className="flex items-start justify-between gap-4">
                                    <div className="flex items-start gap-3 min-w-0 flex-1">
                                        <span className="text-sm font-mono text-muted-foreground mt-0.5 shrink-0 font-semibold">
                                            Q{idx + 1}
                                        </span>
                                        <div className="min-w-0 flex-1">
                                            <p className="text-sm leading-relaxed">{q.question_text}</p>
                                            {q.question_type === 'multiple_choice' && q.options && Array.isArray(q.options) && (
                                                <div className="mt-2 flex flex-wrap gap-1">
                                                    {q.options.map((option: string, optIdx: number) => (
                                                        <span key={optIdx} className="inline-flex items-center px-2 py-0.5 rounded text-xs bg-muted/50 text-muted-foreground">
                                                            {option}
                                                        </span>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                    {getQuestionTypeBadge(q.question_type)}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Import Questions Modal */}
            <ImportQuestionsModal
                frameworkId={id || ""}
                frameworkName={framework.name}
                open={isImportOpen}
                onOpenChange={setIsImportOpen}
                onSuccess={(count) => {
                    queryClient.invalidateQueries({ queryKey: ["frameworks", id, "questions"] });
                }}
            />
        </div>
    );
}
