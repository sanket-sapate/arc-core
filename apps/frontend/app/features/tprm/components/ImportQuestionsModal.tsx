import { useState } from "react";
import { toast } from "sonner";
import { Button } from "~/components/ui/button";
import { Label } from "~/components/ui/label";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "~/components/ui/dialog";
import { Upload, FileText, Download } from "lucide-react";
import { api } from "~/lib/api";

interface ImportQuestionsModalProps {
    frameworkId: string;
    frameworkName: string;
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onSuccess: (importedCount: number) => void;
}

export function ImportQuestionsModal({
    frameworkId,
    frameworkName,
    open,
    onOpenChange,
    onSuccess,
}: ImportQuestionsModalProps) {
    const [file, setFile] = useState<File | null>(null);
    const [isUploading, setIsUploading] = useState(false);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const selectedFile = e.target.files?.[0];
        if (selectedFile) {
            if (!selectedFile.name.endsWith('.csv')) {
                toast.error("Please select a CSV file");
                return;
            }
            setFile(selectedFile);
        }
    };

    const handleDownloadTemplate = () => {
        const csvContent = `question_text,question_type,options,required
"Does the vendor encrypt data at rest?",boolean,,true
"What encryption standard is used?",text,,false
"Select the compliance frameworks",multiple_choice,"ISO 27001|SOC 2|GDPR",true`;

        const blob = new Blob([csvContent], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'framework_questions_template.csv';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
        toast.success("Template downloaded");
    };

    const handleSubmit = async () => {
        if (!file) {
            toast.error("Please select a file");
            return;
        }

        setIsUploading(true);
        const formData = new FormData();
        formData.append('file', file);

        try {
            const response = await api.post(
                `/api/trm/frameworks/${frameworkId}/questions/import`,
                formData
            );

            toast.success(`Successfully imported ${response.data.imported_count} questions`);
            onSuccess(response.data.imported_count);
            setFile(null);
            onOpenChange(false);
        } catch (err: any) {
            const errorMsg = err.response?.data?.error || err.message || "Failed to import questions";
            toast.error(errorMsg);
        } finally {
            setIsUploading(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle>Import Questions from CSV</DialogTitle>
                    <DialogDescription>
                        Upload a CSV file to bulk import questions for <strong>{frameworkName}</strong>
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-4 py-4">
                    <div className="space-y-2">
                        <Label>CSV File</Label>
                        <div className="flex items-center gap-2">
                            <label className="flex-1 cursor-pointer">
                                <div className="flex items-center justify-center gap-2 rounded-md border-2 border-dashed border-muted-foreground/25 p-6 hover:border-muted-foreground/50 transition-colors">
                                    {file ? (
                                        <div className="flex items-center gap-2 text-sm">
                                            <FileText className="h-4 w-4 text-primary" />
                                            <span className="font-medium">{file.name}</span>
                                            <span className="text-muted-foreground">
                                                ({(file.size / 1024).toFixed(1)} KB)
                                            </span>
                                        </div>
                                    ) : (
                                        <div className="flex flex-col items-center gap-1 text-sm text-muted-foreground">
                                            <Upload className="h-5 w-5" />
                                            <span>Click to select CSV file</span>
                                        </div>
                                    )}
                                </div>
                                <input
                                    type="file"
                                    accept=".csv"
                                    onChange={handleFileChange}
                                    className="hidden"
                                />
                            </label>
                        </div>
                    </div>

                    <div className="rounded-md bg-muted/50 p-3 space-y-2">
                        <p className="text-sm font-medium">Required CSV Headers:</p>
                        <ul className="text-xs text-muted-foreground space-y-1 ml-4">
                            <li><code className="bg-muted px-1 rounded">question_text</code> - The question text (required)</li>
                            <li><code className="bg-muted px-1 rounded">question_type</code> - text, boolean, or multiple_choice</li>
                            <li><code className="bg-muted px-1 rounded">options</code> - Pipe-separated values (e.g., "Yes|No|N/A")</li>
                            <li><code className="bg-muted px-1 rounded">required</code> - true or false</li>
                        </ul>
                    </div>

                    <Button
                        variant="outline"
                        size="sm"
                        onClick={handleDownloadTemplate}
                        className="w-full"
                    >
                        <Download className="mr-2 h-4 w-4" />
                        Download Template
                    </Button>
                </div>

                <DialogFooter>
                    <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isUploading}>
                        Cancel
                    </Button>
                    <Button onClick={handleSubmit} disabled={!file || isUploading}>
                        {isUploading ? "Importing..." : "Import Questions"}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
