import { useState } from "react";
import { Plus } from "lucide-react";
import { toast } from "sonner";

import { Button } from "~/components/ui/button";
import { Badge } from "~/components/ui/badge";
import { Skeleton } from "~/components/ui/skeleton";
import {
    Sheet,
    SheetContent,
    SheetDescription,
    SheetHeader,
    SheetTitle,
    SheetTrigger,
} from "~/components/ui/sheet";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "~/components/ui/table";

import {
    useDictionaryItems,
    useCreateDictionaryItem,
} from "~/features/data-intelligence/api/dictionary";
import { DictionaryForm } from "~/features/data-intelligence/components/DictionaryForm";
import type { DictionaryItemFormValues } from "~/features/data-intelligence/types/dictionary";

// ── Helpers ────────────────────────────────────────────────────────────────

const sensitivityVariant: Record<
    string,
    "default" | "secondary" | "destructive" | "outline"
> = {
    low: "secondary",
    medium: "outline",
    high: "destructive",
    critical: "destructive",
};

const sensitivityColor: Record<string, string> = {
    low: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border-emerald-500/25",
    medium:
        "bg-amber-500/15 text-amber-700 dark:text-amber-400 border-amber-500/25",
    high: "bg-red-500/15 text-red-700 dark:text-red-400 border-red-500/25",
    critical:
        "bg-red-600/20 text-red-800 dark:text-red-300 border-red-600/30 font-semibold",
};

// ── Page Component ─────────────────────────────────────────────────────────

export default function DataDictionaryPage() {
    const [sheetOpen, setSheetOpen] = useState(false);
    const { data: items, isLoading, isError } = useDictionaryItems();
    const createMutation = useCreateDictionaryItem();

    const handleCreate = (values: DictionaryItemFormValues) => {
        createMutation.mutate(values, {
            onSuccess: () => {
                toast.success("Data element created successfully");
                setSheetOpen(false);
            },
            onError: (err) => {
                toast.error("Failed to create element", {
                    description: err instanceof Error ? err.message : "Unknown error",
                });
            },
        });
    };

    return (
        <div className="space-y-6">
            {/* ── Header ──────────────────────────────────────────────────── */}
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold tracking-tight">Data Dictionary</h2>
                    <p className="text-sm text-muted-foreground">
                        Define and manage sensitive data types, categories, and detection
                        patterns.
                    </p>
                </div>

                <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
                    <SheetTrigger asChild>
                        <Button>
                            <Plus className="mr-2 h-4 w-4" />
                            New Data Element
                        </Button>
                    </SheetTrigger>

                    <SheetContent className="sm:max-w-lg overflow-y-auto">
                        <SheetHeader>
                            <SheetTitle>Create Data Element</SheetTitle>
                            <SheetDescription>
                                Add a new sensitive data type to the dictionary. It will be
                                available for detection in future scans.
                            </SheetDescription>
                        </SheetHeader>
                        <div className="mt-6">
                            <DictionaryForm
                                onSubmit={handleCreate}
                                isPending={createMutation.isPending}
                            />
                        </div>
                    </SheetContent>
                </Sheet>
            </div>

            {/* ── Loading skeleton ────────────────────────────────────────── */}
            {isLoading && (
                <div className="space-y-3">
                    {Array.from({ length: 6 }).map((_, i) => (
                        <Skeleton key={i} className="h-12 w-full rounded-md" />
                    ))}
                </div>
            )}

            {/* ── Error state ─────────────────────────────────────────────── */}
            {isError && (
                <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-4 text-sm text-destructive">
                    Failed to load dictionary items. Please try again.
                </div>
            )}

            {/* ── Data table ──────────────────────────────────────────────── */}
            {items && (
                <div className="rounded-lg border">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead className="w-[280px]">Name</TableHead>
                                <TableHead>Category</TableHead>
                                <TableHead>Sensitivity</TableHead>
                                <TableHead className="text-center">Status</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {items.length === 0 ? (
                                <TableRow>
                                    <TableCell
                                        colSpan={4}
                                        className="h-32 text-center text-muted-foreground"
                                    >
                                        No data elements yet. Click &ldquo;New Data Element&rdquo; to
                                        add one.
                                    </TableCell>
                                </TableRow>
                            ) : (
                                items.map((item) => (
                                    <TableRow key={item.id}>
                                        <TableCell className="font-medium">{item.name}</TableCell>
                                        <TableCell className="text-muted-foreground">
                                            {item.category}
                                        </TableCell>
                                        <TableCell>
                                            <Badge
                                                variant="outline"
                                                className={sensitivityColor[item.sensitivity]}
                                            >
                                                {item.sensitivity.charAt(0).toUpperCase() +
                                                    item.sensitivity.slice(1)}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="text-center">
                                            <Badge
                                                variant={item.active ? "default" : "secondary"}
                                                className={
                                                    item.active
                                                        ? "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border-emerald-500/25"
                                                        : ""
                                                }
                                            >
                                                {item.active ? "Active" : "Inactive"}
                                            </Badge>
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </div>
            )}
        </div>
    );
}
