import type { Role } from "../types/iam";
import { Badge } from "~/components/ui/badge";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "~/components/ui/sheet";
import { ScrollArea } from "~/components/ui/scroll-area";
import { Shield } from "lucide-react";

interface RoleDetailsSheetProps {
    role?: Role;
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

export function RoleDetailsSheet({ role, open, onOpenChange }: RoleDetailsSheetProps) {
    if (!role) return null;

    return (
        <Sheet open={open} onOpenChange={onOpenChange}>
            <SheetContent>
                <SheetHeader className="mb-6">
                    <SheetTitle className="flex items-center gap-2">
                        <Shield className="h-5 w-5 text-primary" />
                        {role.name} Role
                    </SheetTitle>
                    <SheetDescription>
                        View the specific permissions granted by this role.
                    </SheetDescription>
                </SheetHeader>

                <div className="space-y-4 px-6 pb-6">
                    <div>
                        <h4 className="text-sm font-semibold mb-3">Assigned Permissions</h4>
                        <ScrollArea className="h-[400px] border rounded-md p-4 bg-muted/10">
                            {role.permissions && role.permissions.length > 0 ? (
                                <div className="flex flex-wrap gap-2">
                                    {role.permissions.map((perm) => (
                                        <Badge key={perm} variant="secondary" className="font-mono text-xs">
                                            {perm}
                                        </Badge>
                                    ))}
                                </div>
                            ) : (
                                <p className="text-sm text-muted-foreground italic">No specific permissions listed.</p>
                            )}
                        </ScrollArea>
                    </div>
                </div>
            </SheetContent>
        </Sheet>
    );
}
