import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { createApiKeySchema, type CreateApiKeyData } from "../types/developer";
import { useGenerateApiKey } from "../api/developer";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from "~/components/ui/dialog";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "~/components/ui/select";
import { Copy, Check, KeySquare, AlertTriangle } from "lucide-react";

interface GenerateApiKeyDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

export function GenerateApiKeyDialog({ open, onOpenChange }: GenerateApiKeyDialogProps) {
    const generateMutation = useGenerateApiKey();
    const [createdKey, setCreatedKey] = useState<string | null>(null);
    const [copied, setCopied] = useState(false);

    const form = useForm<CreateApiKeyData>({
        resolver: zodResolver(createApiKeySchema),
        defaultValues: {
            name: "",
            expires_in_days: 30,
        },
    });

    const handleOpenChange = (newOpen: boolean) => {
        if (!newOpen) {
            setTimeout(() => {
                form.reset();
                setCreatedKey(null);
                setCopied(false);
            }, 200);
        }
        onOpenChange(newOpen);
    };

    const onSubmit = (data: CreateApiKeyData) => {
        generateMutation.mutate(data, {
            onSuccess: (res: any) => {
                setCreatedKey(res.raw_key);
            },
        });
    };

    const copyToClipboard = async () => {
        if (createdKey) {
            await navigator.clipboard.writeText(createdKey);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        }
    };

    return (
        <Dialog open={open} onOpenChange={handleOpenChange}>
            <DialogContent className="sm:max-w-[425px]">
                {!createdKey ? (
                    <>
                        <DialogHeader>
                            <DialogTitle>Generate New API Key</DialogTitle>
                            <DialogDescription>
                                Create a new programmatic access key for the ARC ecosystem.
                            </DialogDescription>
                        </DialogHeader>
                        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-4">
                            <div className="space-y-2">
                                <Label htmlFor="name">Key Name</Label>
                                <Input
                                    id="name"
                                    placeholder="e.g. Production Automation"
                                    {...form.register("name")}
                                />
                                {form.formState.errors.name && (
                                    <p className="text-sm text-red-500">{form.formState.errors.name.message}</p>
                                )}
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="expires_in_days">Expiration</Label>
                                <Select
                                    defaultValue="30"
                                    onValueChange={(val) => form.setValue("expires_in_days", parseInt(val))}
                                >
                                    <SelectTrigger id="expires_in_days">
                                        <SelectValue placeholder="Select expiration" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="7">7 Days</SelectItem>
                                        <SelectItem value="30">30 Days</SelectItem>
                                        <SelectItem value="90">90 Days</SelectItem>
                                        <SelectItem value="365">1 Year</SelectItem>
                                        <SelectItem value="0">Never Expires</SelectItem>
                                    </SelectContent>
                                </Select>
                                {form.formState.errors.expires_in_days && (
                                    <p className="text-sm text-red-500">{form.formState.errors.expires_in_days.message}</p>
                                )}
                            </div>

                            <DialogFooter className="mt-6">
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() => handleOpenChange(false)}
                                    disabled={generateMutation.isPending}
                                >
                                    Cancel
                                </Button>
                                <Button type="submit" disabled={generateMutation.isPending}>
                                    {generateMutation.isPending ? "Generating..." : "Generate Key"}
                                </Button>
                            </DialogFooter>
                        </form>
                    </>
                ) : (
                    <>
                        <DialogHeader>
                            <DialogTitle className="flex items-center gap-2">
                                <KeySquare className="h-5 w-5 text-green-600" />
                                API Key Generated
                            </DialogTitle>
                            <DialogDescription className="text-amber-600 flex items-start gap-2 pt-2 bg-amber-50 p-3 rounded-md">
                                <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
                                <span className="text-sm font-medium">
                                    Please copy this key and save it securely. You will not be able to view it again.
                                </span>
                            </DialogDescription>
                        </DialogHeader>

                        <div className="py-6">
                            <div className="flex items-center space-x-2">
                                <div className="grid flex-1 gap-2">
                                    <Input
                                        readOnly
                                        value={createdKey}
                                        className="font-mono bg-muted/50"
                                    />
                                </div>
                                <Button
                                    type="button"
                                    size="sm"
                                    className="px-3"
                                    onClick={copyToClipboard}
                                >
                                    {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                                </Button>
                            </div>
                        </div>

                        <DialogFooter>
                            <Button type="button" onClick={() => handleOpenChange(false)}>
                                I have saved this key
                            </Button>
                        </DialogFooter>
                    </>
                )}
            </DialogContent>
        </Dialog>
    );
}
