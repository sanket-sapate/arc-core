import React from 'react';
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogTrigger,
} from "~/components/ui/dialog";
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
    FormDescription,
} from "~/components/ui/form";
import { Input } from "~/components/ui/input";
import { Button } from "~/components/ui/button";
import { useTriggerNetworkScan } from "../api/discovery";

// We handle ports as a string in the form "80, 443" and convert it to number[]
const formSchema = z.object({
    target_range: z.string().min(1, "Target range is required (e.g., 192.168.1.0/24)"),
    portsSchema: z.string().min(1, "At least one port must be specified"),
});

type FormData = z.infer<typeof formSchema>;

export function NetworkDiscoveryModal() {
    const [open, setOpen] = React.useState(false);
    const { mutate: scanNetwork, isPending } = useTriggerNetworkScan();

    const form = useForm<FormData>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            target_range: "",
            portsSchema: "80, 443, 22",
        },
    });

    const onSubmit = (data: FormData) => {
        // Convert comma-separated string back to array of numbers
        const ports = data.portsSchema
            .split(',')
            .map((p) => parseInt(p.trim(), 10))
            .filter((p) => !isNaN(p));
            
        if (ports.length === 0) {
            form.setError("portsSchema", { message: "Invalid ports provided" });
            return;
        }

        scanNetwork({
            target_range: data.target_range,
            ports: ports,
        }, {
            onSuccess: () => {
                toast.success("Network discovery scan successfully queued!");
                setOpen(false);
                form.reset();
            },
            onError: (err: any) => {
                toast.error(err?.response?.data?.message || err.message || "Failed to trigger scan.");
            }
        });
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button variant="outline">Run Discovery Scan</Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Network Asset Discovery</DialogTitle>
                    <DialogDescription>
                        Trigger a broad IP sweep to locate unmapped assets or hidden vendors.
                    </DialogDescription>
                </DialogHeader>
                
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 pt-4">
                        <FormField
                            control={form.control}
                            name="target_range"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Target Range (CIDR/IP)</FormLabel>
                                    <FormControl>
                                        <Input placeholder="e.g. 192.168.1.0/24" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="portsSchema"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Ports</FormLabel>
                                    <FormControl>
                                        <Input placeholder="80, 443, 22" {...field} />
                                    </FormControl>
                                    <FormDescription>Comma-separated list of ports.</FormDescription>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <div className="flex justify-end pt-2">
                            <Button type="submit" disabled={isPending}>
                                {isPending ? "Scanning..." : "Start Scan"}
                            </Button>
                        </div>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    );
}
