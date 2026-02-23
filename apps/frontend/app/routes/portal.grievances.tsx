import { useState } from "react";
import { Header } from "~/components/shared/Header";
import { PortalNav } from "~/components/portal/PortalNav";
import { Button } from "~/components/ui/button";
import { useUserGrievances, useSubmitGrievance } from "~/features/user-portal/api/portal";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { Input } from "~/components/ui/input";
import { Textarea } from "~/components/ui/textarea";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "~/components/ui/table";
import { AlertTriangle, Plus } from "lucide-react";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "~/components/ui/dialog";
import { toast } from "sonner";

export default function PortalGrievances() {
    const { data: grievances, isLoading } = useUserGrievances();
    const { mutateAsync: submitGrievance, isPending } = useSubmitGrievance();
    const [open, setOpen] = useState(false);

    const [issueType, setIssueType] = useState("");
    const [description, setDescription] = useState("");

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            if (!issueType || !description) return;
            await submitGrievance({ issue_type: issueType, description, priority: "medium" });
            toast.success("Grievance submitted successfully");
            setOpen(false);
            setDescription("");
            setIssueType("");
        } catch (err: any) {
            toast.error("Failed to submit grievance", { description: err.message });
        }
    };

    return (
        <div className="min-h-screen flex flex-col bg-slate-50">
            <Header />
            <main className="flex-1 w-full max-w-6xl mx-auto px-4 py-8 space-y-8">
                <h1 className="text-3xl font-bold tracking-tight text-slate-900">Privacy Grievances</h1>

                <PortalNav />

                <Card className="bg-white shadow-sm border-slate-200">
                    <CardHeader className="flex flex-row items-center justify-between">
                        <div className="space-y-1">
                            <CardTitle>Your Grievances</CardTitle>
                        </div>
                        <Dialog open={open} onOpenChange={setOpen}>
                            <DialogTrigger asChild>
                                <Button className="bg-amber-600 hover:bg-amber-700">
                                    <Plus className="w-4 h-4 mr-2" /> File Grievance
                                </Button>
                            </DialogTrigger>
                            <DialogContent className="sm:max-w-[425px]">
                                <DialogHeader>
                                    <DialogTitle>File a Grievance</DialogTitle>
                                    <DialogDescription>
                                        Report an issue regarding the processing of your data. By law, grievances must be resolved within 30 days.
                                    </DialogDescription>
                                </DialogHeader>
                                <form onSubmit={handleSubmit} className="space-y-4 pt-4">
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium">Issue Summary</label>
                                        <Input
                                            placeholder="E.g., Unauthorized data sharing"
                                            value={issueType}
                                            onChange={(e) => setIssueType(e.target.value)}
                                            required
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium">Detailed Description</label>
                                        <Textarea
                                            placeholder="Please provide specifics of your complaint..."
                                            value={description}
                                            onChange={(e) => setDescription(e.target.value)}
                                            required
                                        />
                                    </div>
                                    <Button type="submit" disabled={isPending} className="w-full bg-amber-600 hover:bg-amber-700">
                                        {isPending ? "Submitting..." : "Submit Grievance"}
                                    </Button>
                                </form>
                            </DialogContent>
                        </Dialog>
                    </CardHeader>
                    <CardContent>
                        {isLoading ? (
                            <p className="text-sm text-slate-500 animate-pulse">Loading grievances...</p>
                        ) : grievances?.length === 0 ? (
                            <div className="p-12 text-center text-slate-500 border-dashed border-2 rounded-xl border-slate-200">
                                <AlertTriangle className="w-12 h-12 mx-auto text-slate-300 mb-4" />
                                <p className="text-lg font-medium text-slate-600">No open grievances</p>
                                <p className="text-sm mt-1">You haven't filed any grievances.</p>
                            </div>
                        ) : (
                            <div className="rounded-md border">
                                <Table>
                                    <TableHeader>
                                        <TableHead>Ticket ID</TableHead>
                                        <TableHead>Issue</TableHead>
                                        <TableHead>Status</TableHead>
                                        <TableHead>Submitted</TableHead>
                                    </TableHeader>
                                    <TableBody>
                                        {grievances?.map((g) => (
                                            <TableRow key={g.id}>
                                                <TableCell className="font-mono text-xs text-slate-500">{g.id.split('-')[0].toUpperCase()}</TableCell>
                                                <TableCell className="font-medium text-slate-800">{g.issue_type}</TableCell>
                                                <TableCell>
                                                    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium uppercase
                            ${g.status === 'resolved' ? 'bg-green-100 text-green-800' : 'bg-amber-100 text-amber-800'}`}>
                                                        {g.status}
                                                    </span>
                                                </TableCell>
                                                <TableCell className="text-slate-500 text-sm">{new Date(g.created_at).toLocaleDateString()}</TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </main>
        </div>
    );
}
