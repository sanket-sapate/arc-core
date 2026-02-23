import { useState } from "react";
import { Header } from "~/components/shared/Header";
import { PortalNav } from "~/components/portal/PortalNav";
import { Button } from "~/components/ui/button";
import { useUserNominees, useRegisterNominee } from "~/features/user-portal/api/portal";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { Input } from "~/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "~/components/ui/table";
import { UserCheck, Plus } from "lucide-react";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "~/components/ui/dialog";
import { toast } from "sonner";

export default function PortalNominee() {
    const { data: nominees, isLoading } = useUserNominees();
    const { mutateAsync: registerNominee, isPending } = useRegisterNominee();
    const [open, setOpen] = useState(false);

    const [nomineeName, setNomineeName] = useState("");
    const [nomineeEmail, setNomineeEmail] = useState("");
    const [nomineeRelation, setNomineeRelation] = useState("");

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!nomineeName || !nomineeEmail || !nomineeRelation) return;
        try {
            await registerNominee({ nominee_name: nomineeName, nominee_email: nomineeEmail, nominee_relation: nomineeRelation });
            toast.success("Nominee registered successfully");
            setOpen(false);
            setNomineeName("");
            setNomineeEmail("");
            setNomineeRelation("");
        } catch (err: any) {
            toast.error("Failed to register nominee", { description: err.message });
        }
    };

    return (
        <div className="min-h-screen flex flex-col bg-slate-50">
            <Header />
            <main className="flex-1 w-full max-w-6xl mx-auto px-4 py-8 space-y-8">
                <h1 className="text-3xl font-bold tracking-tight text-slate-900">Nominee Registration</h1>

                <PortalNav />

                <Card className="bg-white shadow-sm border-slate-200">
                    <CardHeader className="flex flex-row items-center justify-between">
                        <div className="space-y-1">
                            <CardTitle>Your Authorized Nominees</CardTitle>
                        </div>
                        <Dialog open={open} onOpenChange={setOpen}>
                            <DialogTrigger asChild>
                                <Button className="bg-indigo-600 hover:bg-indigo-700">
                                    <Plus className="w-4 h-4 mr-2" /> Register Nominee
                                </Button>
                            </DialogTrigger>
                            <DialogContent className="sm:max-w-[425px]">
                                <DialogHeader>
                                    <DialogTitle>Register Authorized Nominee</DialogTitle>
                                    <DialogDescription>
                                        Under the DPDP Act, you can nominate an individual to exercise your rights in the event of death or incapacity.
                                    </DialogDescription>
                                </DialogHeader>
                                <form onSubmit={handleSubmit} className="space-y-4 pt-4">
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium">Nominee Full Name</label>
                                        <Input
                                            placeholder="John Doe"
                                            value={nomineeName}
                                            onChange={(e) => setNomineeName(e.target.value)}
                                            required
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium">Nominee Email Address</label>
                                        <Input
                                            type="email"
                                            placeholder="nominee@example.com"
                                            value={nomineeEmail}
                                            onChange={(e) => setNomineeEmail(e.target.value)}
                                            required
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium">Relationship to You</label>
                                        <Input
                                            placeholder="Spouse, Sibling, Legal Guardian..."
                                            value={nomineeRelation}
                                            onChange={(e) => setNomineeRelation(e.target.value)}
                                            required
                                        />
                                    </div>
                                    <Button type="submit" disabled={isPending} className="w-full">
                                        {isPending ? "Registering..." : "Register Nominee"}
                                    </Button>
                                </form>
                            </DialogContent>
                        </Dialog>
                    </CardHeader>
                    <CardContent>
                        {isLoading ? (
                            <p className="text-sm text-slate-500 animate-pulse">Loading nominees...</p>
                        ) : nominees?.length === 0 ? (
                            <div className="p-12 text-center text-slate-500 border-dashed border-2 rounded-xl border-slate-200">
                                <UserCheck className="w-12 h-12 mx-auto text-slate-300 mb-4" />
                                <p className="text-lg font-medium text-slate-600">No Nominees Registered</p>
                                <p className="text-sm mt-1">You haven't registered any authorized representatives.</p>
                            </div>
                        ) : (
                            <div className="rounded-md border">
                                <Table>
                                    <TableHeader>
                                        <TableHead>Nominee Name</TableHead>
                                        <TableHead>Email</TableHead>
                                        <TableHead>Relationship</TableHead>
                                        <TableHead>Status</TableHead>
                                        <TableHead>Date Added</TableHead>
                                    </TableHeader>
                                    <TableBody>
                                        {nominees?.map((n) => (
                                            <TableRow key={n.id}>
                                                <TableCell className="font-medium text-slate-800">{n.nominee_name}</TableCell>
                                                <TableCell className="text-slate-600">{n.nominee_email}</TableCell>
                                                <TableCell className="text-slate-600">{n.nominee_relation}</TableCell>
                                                <TableCell>
                                                    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium uppercase
                            ${n.status === 'accepted' ? 'bg-green-100 text-green-800' : 'bg-slate-100 text-slate-800'}`}>
                                                        {n.status}
                                                    </span>
                                                </TableCell>
                                                <TableCell className="text-slate-500 text-sm">{new Date(n.created_at).toLocaleDateString()}</TableCell>
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
