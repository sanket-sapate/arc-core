import React from "react";
import { format } from "date-fns";
import { Loader2, Clock, CheckCircle2, AlertCircle } from "lucide-react";
import {
    Sheet,
    SheetContent,
    SheetDescription,
    SheetHeader,
    SheetTitle,
} from "~/components/ui/sheet";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "~/components/ui/select";
import { ScrollArea } from "~/components/ui/scroll-area";
import { Badge } from "~/components/ui/badge";

export interface RequestField {
    label: string;
    value: React.ReactNode;
}

export interface RequestDetailsSheetProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    title: string;
    description?: string;
    fields: RequestField[];
    status: string;
    statusOptions: { value: string; label: string }[];
    onStatusChange: (newStatus: string) => void;
    isUpdatingStatus?: boolean;
    createdAt: string;
    dueDate?: string | null;
}

export function RequestDetailsSheet({
    open,
    onOpenChange,
    title,
    description,
    fields,
    status,
    statusOptions,
    onStatusChange,
    isUpdatingStatus,
    createdAt,
    dueDate,
}: RequestDetailsSheetProps) {
    // Simple styling for badges based on status
    const getBadgeVariant = (val: string) => {
        switch (val) {
            case "resolved":
            case "closed":
                return "default";
            case "in_progress":
                return "secondary";
            case "rejected":
                return "destructive";
            default:
                return "outline";
        }
    };

    return (
        <Sheet open={open} onOpenChange={onOpenChange}>
            <SheetContent className="sm:max-w-xl w-full flex flex-col p-0 h-full">
                <div className="px-6 py-6 border-b">
                    <SheetHeader>
                        <SheetTitle className="text-xl flex items-center justify-between">
                            {title}
                            <Badge variant={getBadgeVariant(status)} className="capitalize">
                                {status.replace("_", " ")}
                            </Badge>
                        </SheetTitle>
                        {description && <SheetDescription>{description}</SheetDescription>}
                    </SheetHeader>
                </div>

                <ScrollArea className="flex-1 px-6 py-4">
                    <div className="space-y-6">
                        <div className="grid grid-cols-2 gap-4 bg-muted/30 p-4 rounded-md border">
                            <div>
                                <span className="text-sm text-muted-foreground block mb-1">Created At</span>
                                <span className="text-sm font-medium flex items-center gap-2">
                                    <Clock className="h-4 w-4 text-muted-foreground" />
                                    {format(new Date(createdAt), "MMM d, yyyy HH:mm")}
                                </span>
                            </div>
                            {dueDate && (
                                <div>
                                    <span className="text-sm text-muted-foreground block mb-1">Due Date (SLA)</span>
                                    <span className="text-sm font-medium flex items-center gap-2 text-amber-600">
                                        <AlertCircle className="h-4 w-4" />
                                        {format(new Date(dueDate), "MMM d, yyyy")}
                                    </span>
                                </div>
                            )}
                        </div>

                        <div className="space-y-4">
                            <h4 className="text-sm font-semibold border-b pb-2">Request Details</h4>
                            <div className="grid grid-cols-1 gap-y-4">
                                {fields.map((field, idx) => (
                                    <div key={idx} className="space-y-1">
                                        <span className="text-sm text-muted-foreground">{field.label}</span>
                                        <div className="text-sm bg-muted/10 p-2 rounded border border-border/50 min-h-[2.5rem]">
                                            {field.value || <span className="text-muted-foreground italic">Not provided</span>}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="space-y-4 pt-4 border-t">
                            <h4 className="text-sm font-semibold">Workflow Management</h4>
                            <div className="space-y-2">
                                <label className="text-sm text-muted-foreground">Update Status</label>
                                <Select
                                    value={status}
                                    onValueChange={onStatusChange}
                                    disabled={isUpdatingStatus}
                                >
                                    <SelectTrigger className="w-[200px]">
                                        <SelectValue placeholder="Select Status" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {statusOptions.map((opt) => (
                                            <SelectItem key={opt.value} value={opt.value}>
                                                <div className="flex items-center gap-2">
                                                    {isUpdatingStatus && status === opt.value && <Loader2 className="h-4 w-4 animate-spin" />}
                                                    {opt.label}
                                                </div>
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                    </div>
                </ScrollArea>
            </SheetContent>
        </Sheet>
    );
}
