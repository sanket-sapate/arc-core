import { useState } from "react";
import { Header } from "~/components/shared/Header";
import { PortalNav } from "~/components/portal/PortalNav";
import { Button } from "~/components/ui/button";
import { useUserRequests, useSubmitPrivacyRequest } from "~/features/user-portal/api/portal";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { Input } from "~/components/ui/input";
import { Textarea } from "~/components/ui/textarea";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "~/components/ui/table";
import { FileText, Plus } from "lucide-react";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "~/components/ui/dialog";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "~/components/ui/select";
import { toast } from "sonner";

export default function PortalRequests() {
    const { data: requests, isLoading } = useUserRequests();
    const { mutateAsync: submitRequest, isPending } = useSubmitPrivacyRequest();
    const [open, setOpen] = useState(false);

    const [type, setType] = useState<string>("access");
    const [description, setDescription] = useState("");

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await submitRequest({ type, description });
            toast.success("Request submitted successfully");
            setOpen(false);
            setDescription("");
            setType("access");
        } catch (err: any) {
            toast.error("Failed to submit request", { description: err.message });
        }
    };

    return (
        <div className="min-h-screen flex flex-col bg-background">
            <Header />
            <main className="flex-1 w-full max-w-6xl mx-auto px-4 py-8 space-y-8">
                <h1 className="text-3xl font-bold tracking-tight text-foreground">Data Subject Requests</h1>

                <PortalNav />

                <Card className="bg-card shadow-sm border">
                    <CardHeader className="flex flex-row items-center justify-between">
                        <div className="space-y-1">
                            <CardTitle className="text-foreground">Your Requests</CardTitle>
                        </div>
                        <Dialog open={open} onOpenChange={setOpen}>
                            <DialogTrigger asChild>
                                <Button className="bg-primary hover:bg-primary/90">
                                    <Plus className="w-4 h-4 mr-2" /> New Request
                                </Button>
                            </DialogTrigger>
                            <DialogContent className="sm:max-w-[425px]">
                                <DialogHeader>
                                    <DialogTitle>Submit a Privacy Request</DialogTitle>
                                    <DialogDescription>
                                        Exercise your data rights. By law, most requests will be resolved within 7 days.
                                    </DialogDescription>
                                </DialogHeader>
                                <form onSubmit={handleSubmit} className="space-y-4 pt-4">
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium">Request Type</label>
                                        <Select value={type} onValueChange={setType}>
                                            <SelectTrigger>
                                                <SelectValue placeholder="Select type" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="access">Access My Data</SelectItem>
                                                <SelectItem value="erasure">Delete My Data (Erasure)</SelectItem>
                                                <SelectItem value="correction">Correct My Data</SelectItem>
                                                <SelectItem value="portability">Data Portability</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium">Details</label>
                                        <Textarea
                                            placeholder="Please provide any additional details..."
                                            value={description}
                                            onChange={(e) => setDescription(e.target.value)}
                                            required
                                        />
                                    </div>
                                    <Button type="submit" disabled={isPending} className="w-full">
                                        {isPending ? "Submitting..." : "Submit Request"}
                                    </Button>
                                </form>
                            </DialogContent>
                        </Dialog>
                    </CardHeader>
                    <CardContent>
                        {isLoading ? (
                            <p className="text-sm text-muted-foreground animate-pulse">Loading requests...</p>
                        ) : requests?.length === 0 ? (
                            <div className="p-12 text-center text-muted-foreground border-dashed border-2 rounded-xl border-border">
                                <FileText className="w-12 h-12 mx-auto text-muted-foreground/50 mb-4" />
                                <p className="text-lg font-medium text-foreground">No pending requests</p>
                                <p className="text-sm mt-1 text-muted-foreground">You haven't submitted any data subject requests.</p>
                            </div>
                        ) : (
                            <div className="rounded-md border">
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Ticket ID</TableHead>
                                            <TableHead>Type</TableHead>
                                            <TableHead>Status</TableHead>
                                            <TableHead>Submitted</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {requests?.map((req) => (
                                            <TableRow key={req.id}>
                                                <TableCell className="font-mono text-xs text-muted-foreground">{req.id.split('-')[0].toUpperCase()}</TableCell>
                                                <TableCell className="capitalize font-medium text-foreground">{req.type}</TableCell>
                                                <TableCell>
                                                    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium uppercase
                            ${req.status === 'resolved' ? 'bg-green-100 dark:bg-green-900/20 text-green-800 dark:text-green-200' :
                                                            req.status === 'rejected' ? 'bg-red-100 dark:bg-red-900/20 text-red-800 dark:text-red-200' :
                                                                'bg-primary/10 text-primary dark:text-primary'}`}>
                                                        {req.status}
                                                    </span>
                                                </TableCell>
                                                <TableCell className="text-muted-foreground text-sm">{new Date(req.created_at).toLocaleDateString()}</TableCell>
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
