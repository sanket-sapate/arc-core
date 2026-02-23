import { useState } from "react";
import { useApiKeys, useRevokeApiKey } from "../features/settings/api/developer";
import { type ApiKey } from "../features/settings/types/developer";
import { GenerateApiKeyDialog } from "../features/settings/components/GenerateApiKeyDialog";
import { Button } from "~/components/ui/button";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "~/components/ui/table";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "~/components/ui/alert-dialog";
import { Badge } from "~/components/ui/badge";
import { Code2, Key, Trash2, CalendarClock } from "lucide-react";
import { format, isPast } from "date-fns";

export default function DeveloperSettingsPage() {
    const { data: apiKeysData, isLoading } = useApiKeys();
    const apiKeys = Array.isArray(apiKeysData) ? apiKeysData : ((apiKeysData as any)?.data || []);

    const revokeMutation = useRevokeApiKey();

    const [isGenerateOpen, setIsGenerateOpen] = useState(false);
    const [keyToRevoke, setKeyToRevoke] = useState<ApiKey | null>(null);

    const handleRevoke = () => {
        if (keyToRevoke) {
            revokeMutation.mutate(keyToRevoke.id, {
                onSuccess: () => setKeyToRevoke(null),
            });
        }
    };

    return (
        <div className="p-8 max-w-7xl mx-auto space-y-8">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Developer & API</h1>
                    <p className="text-muted-foreground mt-1 text-sm">
                        Manage programmatic access and webhooks for integrations.
                    </p>
                </div>
            </div>

            <div className="space-y-4">
                <div className="flex justify-between items-center">
                    <h2 className="text-xl font-semibold flex items-center gap-2">
                        <Code2 className="h-5 w-5 text-primary" />
                        Active API Keys
                    </h2>
                    <Button onClick={() => setIsGenerateOpen(true)}>
                        <Key className="mr-2 h-4 w-4" />
                        Generate New Key
                    </Button>
                </div>

                <div className="rounded-md border bg-card">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Name</TableHead>
                                <TableHead>Key Prefix</TableHead>
                                <TableHead>Created</TableHead>
                                <TableHead>Status / Expiration</TableHead>
                                <TableHead className="text-right">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {isLoading ? (
                                <TableRow>
                                    <TableCell colSpan={5} className="h-24 text-center">
                                        Loading API keys...
                                    </TableCell>
                                </TableRow>
                            ) : apiKeys.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={5} className="h-24 text-center text-muted-foreground">
                                        No active API keys found. Generate one to get started.
                                    </TableCell>
                                </TableRow>
                            ) : (
                                (apiKeys || []).map((k: ApiKey) => {
                                    const isExpired = k.expires_at ? isPast(new Date(k.expires_at)) : false;

                                    return (
                                        <TableRow key={k.id}>
                                            <TableCell className="font-medium">{k.name}</TableCell>
                                            <TableCell className="font-mono text-sm text-muted-foreground">
                                                {k.key_prefix}
                                            </TableCell>
                                            <TableCell className="text-sm text-muted-foreground">
                                                {format(new Date(k.created_at), "MMM d, yyyy")}
                                            </TableCell>
                                            <TableCell>
                                                {isExpired ? (
                                                    <Badge variant="destructive">Expired</Badge>
                                                ) : k.expires_at ? (
                                                    <div className="flex items-center text-sm text-muted-foreground">
                                                        <CalendarClock className="h-3.5 w-3.5 mr-1.5" />
                                                        {format(new Date(k.expires_at), "MMM d, yyyy")}
                                                    </div>
                                                ) : (
                                                    <Badge variant="outline" className="border-green-200 text-green-800 bg-green-50">
                                                        Never Expires
                                                    </Badge>
                                                )}
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    className="text-red-600 hover:text-red-700 hover:bg-red-50"
                                                    onClick={() => setKeyToRevoke(k)}
                                                >
                                                    <Trash2 className="h-4 w-4 mr-1.5" />
                                                    Revoke
                                                </Button>
                                            </TableCell>
                                        </TableRow>
                                    );
                                })
                            )}
                        </TableBody>
                    </Table>
                </div>
            </div>

            <GenerateApiKeyDialog
                open={isGenerateOpen}
                onOpenChange={setIsGenerateOpen}
            />

            <AlertDialog open={!!keyToRevoke} onOpenChange={(open: boolean) => !open && setKeyToRevoke(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Revoke API Key</AlertDialogTitle>
                        <AlertDialogDescription>
                            Are you sure you want to revoke the key "{keyToRevoke?.name}"?
                            Any applications or scripts using this key will immediately lose access to the API.
                            This action cannot be undone.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel disabled={revokeMutation.isPending}>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={(e: React.MouseEvent) => {
                                e.preventDefault();
                                handleRevoke();
                            }}
                            disabled={revokeMutation.isPending}
                            className="bg-red-600 hover:bg-red-700"
                        >
                            {revokeMutation.isPending ? "Revoking..." : "Revoke Key"}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}
