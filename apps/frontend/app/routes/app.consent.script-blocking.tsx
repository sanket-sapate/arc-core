import { useState } from "react";
import { format } from "date-fns";
import { Copy, Plus, Loader2, CheckCircle2, XCircle, Search, Trash2, Edit2, ShieldAlert } from "lucide-react";

import { useScriptRules, useDeleteScriptRule } from "~/features/consent/api/script-rules";
import { usePurposes } from "~/features/consent/api/purposes";
import { ScriptRuleEditor } from "~/features/consent/components/ScriptRuleEditor";
import { type ScriptRule } from "~/features/consent/types/script-rule";

import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Badge } from "~/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "~/components/ui/table";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "~/components/ui/card";
import { Switch } from "~/components/ui/switch";
import { toast } from "sonner";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "~/components/ui/alert-dialog";
import { useUpdateScriptRule } from "~/features/consent/api/script-rules";

export default function ScriptBlockingPage() {
    const { data: rules, isLoading: rulesLoading } = useScriptRules();
    const { data: purposes, isLoading: purpLoading } = usePurposes();

    const deleteRule = useDeleteScriptRule();
    const updateRule = useUpdateScriptRule();

    const [isEditorOpen, setIsEditorOpen] = useState(false);
    const [selectedRule, setSelectedRule] = useState<ScriptRule | null>(null);
    const [ruleToDelete, setRuleToDelete] = useState<string | null>(null);
    const [searchQuery, setSearchQuery] = useState("");

    const handleCreateNew = () => {
        setSelectedRule(null);
        setIsEditorOpen(true);
    };

    const handleEdit = (rule: ScriptRule) => {
        setSelectedRule(rule);
        setIsEditorOpen(true);
    };

    const confirmDelete = () => {
        if (!ruleToDelete) return;
        deleteRule.mutate(ruleToDelete, {
            onSuccess: () => {
                toast.success("Rule deleted successfully");
                setRuleToDelete(null);
            },
            onError: (err) => {
                toast.error("Failed to delete rule", { description: err.message });
                setRuleToDelete(null);
            }
        });
    };

    const toggleRuleActive = (rule: ScriptRule) => {
        updateRule.mutate({
            id: rule.id,
            data: { active: !rule.active }
        }, {
            onSuccess: () => {
                toast.success(`Rule ${!rule.active ? 'enabled' : 'disabled'} successfully`);
            },
            onError: (err) => {
                toast.error("Failed to update rule status", { description: err.message });
            }
        });
    };

    const getPurposeName = (purposeId: string) => {
        if (purpLoading || !purposes) return "Loading...";
        const purpose = purposes.find((p) => p.id === purposeId);
        return purpose ? purpose.name : "Unknown Category";
    };

    const filteredRules = rules?.filter(r =>
        r.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        r.script_domain.toLowerCase().includes(searchQuery.toLowerCase())
    ) || [];

    const isLoading = rulesLoading || purpLoading;

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold tracking-tight">Script Blocking</h2>
                    <p className="text-muted-foreground">Manage rules to block third-party scripts based on user consent preferences.</p>
                </div>
                <Button onClick={handleCreateNew}>
                    <Plus className="mr-2 h-4 w-4" /> Add Rule
                </Button>
            </div>

            <Card>
                <CardHeader className="pb-3 border-b border-border/50 bg-muted/20">
                    <div className="flex items-center justify-between">
                        <div>
                            <CardTitle className="text-lg">Active Rules</CardTitle>
                            <CardDescription>Scripts matching these rules will be blocked until the associated purpose is consented to.</CardDescription>
                        </div>
                        <div className="relative w-64">
                            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                            <Input
                                type="search"
                                placeholder="Search rules..."
                                className="w-full bg-background pl-8"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                        </div>
                    </div>
                </CardHeader>
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Rule Details</TableHead>
                            <TableHead>Consent Category</TableHead>
                            <TableHead>Match Type</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {isLoading ? (
                            <TableRow><TableCell colSpan={5} className="text-center text-muted-foreground py-8"><Loader2 className="animate-spin h-5 w-5 mx-auto" /></TableCell></TableRow>
                        ) : filteredRules.length === 0 ? (
                            <TableRow><TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                                {searchQuery ? "No rules matching your search." : "No script blocking rules configured."}
                            </TableCell></TableRow>
                        ) : (
                            filteredRules.map((rule) => (
                                <TableRow key={rule.id}>
                                    <TableCell>
                                        <div className="space-y-1">
                                            <p className="font-medium">{rule.name}</p>
                                            <code className="text-xs bg-muted px-1.5 py-0.5 rounded text-muted-foreground font-mono">
                                                {rule.script_domain}
                                            </code>
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <Badge variant="outline" className="bg-blue-50/50 text-blue-700 border-blue-200 dark:bg-blue-900/20 dark:text-blue-400 dark:border-blue-800">
                                            {getPurposeName(rule.purpose_id)}
                                        </Badge>
                                    </TableCell>
                                    <TableCell>
                                        <span className="text-sm capitalize">{rule.rule_type}</span>
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex items-center space-x-2">
                                            <Switch
                                                checked={rule.active}
                                                onCheckedChange={() => toggleRuleActive(rule)}
                                                disabled={updateRule.isPending && updateRule.variables?.id === rule.id}
                                            />
                                            <span className={`text-sm ${rule.active ? 'text-emerald-600 font-medium' : 'text-muted-foreground'}`}>
                                                {rule.active ? 'Active' : 'Inactive'}
                                            </span>
                                        </div>
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <div className="flex items-center justify-end gap-2">
                                            <Button variant="ghost" size="icon" onClick={() => handleEdit(rule)}>
                                                <Edit2 className="h-4 w-4" />
                                                <span className="sr-only">Edit</span>
                                            </Button>
                                            <Button variant="ghost" size="icon" className="text-destructive hover:bg-destructive/10 hover:text-destructive" onClick={() => setRuleToDelete(rule.id)}>
                                                <Trash2 className="h-4 w-4" />
                                                <span className="sr-only">Delete</span>
                                            </Button>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </Card>

            <ScriptRuleEditor
                open={isEditorOpen}
                onOpenChange={setIsEditorOpen}
                initialData={selectedRule}
            />

            <AlertDialog open={!!ruleToDelete} onOpenChange={(open) => !open && setRuleToDelete(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                        <AlertDialogDescription>
                            This will permanently delete the script blocking rule. This action cannot be undone. Scripts matching this pattern will no longer be blocked.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={confirmDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                            {deleteRule.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                            Delete Rule
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}
