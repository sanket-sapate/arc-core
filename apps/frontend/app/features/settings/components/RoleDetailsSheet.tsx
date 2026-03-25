import { useMemo } from "react";
import type { Role } from "../types/iam";
import { Badge } from "~/components/ui/badge";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "~/components/ui/sheet";
import { ScrollArea } from "~/components/ui/scroll-area";
import { Shield } from "lucide-react";

const GROUP_LABELS: Record<string, string> = {
    vendors: "Vendors",
    frameworks: "Assessment Frameworks",
    assessments: "Vendor Assessments",
    dpas: "Data Processing Agreements",
    audit_cycles: "Audit Cycles",
    consents: "Consent Management",
    script_blocking: "Script Blocking",
    ropa: "Records of Processing",
    dpia: "Impact Assessments",
    dsr: "Data Subject Requests",
    breaches: "Data Breaches",
    discovery: "Data Discovery",
    sources: "Data Sources",
    dictionary: "Data Dictionary",
    cookie_scanner: "Cookie Scanner",
    users: "User Management",
    roles: "Role Management",
    api_keys: "API Keys",
    integrations: "Integrations",
    audit_logs: "Audit Logs",
    trm: "Third-Party Risk Management",
    privacy: "Privacy Operations",
    item: "Asset Management",
    task: "Task Management",
    settings: "Settings",
    iam: "Identity & Access",
};

interface RoleDetailsSheetProps {
    role?: Role;
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

export function RoleDetailsSheet({ role, open, onOpenChange }: RoleDetailsSheetProps) {
    const permsByGroup = useMemo(() => {
        if (!role?.permissions) return {};
        return role.permissions.reduce((acc, slug) => {
            const dotIdx = slug.indexOf(".");
            const colonIdx = slug.indexOf(":");
            const separatorIdx = dotIdx !== -1 ? dotIdx : colonIdx;
            const group = separatorIdx !== -1 ? slug.slice(0, separatorIdx) : slug;
            if (!acc[group]) acc[group] = [];
            acc[group].push(slug);
            return acc;
        }, {} as Record<string, string[]>);
    }, [role?.permissions]);

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
                        {role.description || "View the specific permissions granted by this role."}
                    </SheetDescription>
                </SheetHeader>

                <div className="space-y-4 px-6 pb-6">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <span className="font-medium">{role.permissions?.length || 0}</span> permissions assigned
                    </div>

                    <ScrollArea className="h-[450px] border rounded-md p-4 bg-muted/10">
                        {role.permissions && role.permissions.length > 0 ? (
                            <div className="space-y-5">
                                {Object.entries(permsByGroup).map(([group, slugs]) => (
                                    <div key={group} className="space-y-2">
                                        <h4 className="text-xs font-semibold tracking-wider text-muted-foreground uppercase">
                                            {GROUP_LABELS[group] || `${group} Module`}
                                        </h4>
                                        <div className="flex flex-wrap gap-1.5">
                                            {slugs.map((slug) => (
                                                <Badge key={slug} variant="secondary" className="font-mono text-xs">
                                                    {slug}
                                                </Badge>
                                            ))}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <p className="text-sm text-muted-foreground italic">No specific permissions listed.</p>
                        )}
                    </ScrollArea>
                </div>
            </SheetContent>
        </Sheet>
    );
}
