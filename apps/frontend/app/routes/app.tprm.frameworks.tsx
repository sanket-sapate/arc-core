import { type MetaFunction } from "react-router";
import { useFrameworks } from "../features/tprm/api/frameworks";
import { Card, CardHeader, CardTitle, CardContent } from "~/components/ui/card";
import { Button } from "~/components/ui/button";
import { Loader2, Plus, FileText, ArrowRight } from "lucide-react";
import { format } from "date-fns";

export const meta: MetaFunction = () => {
    return [
        { title: "Frameworks | ARC TPRM" },
        { name: "description", content: "Manage risk and compliance frameworks" },
    ];
};

export default function FrameworksPage() {
    const { data: frameworks, isLoading } = useFrameworks();

    return (
        <div className="flex-1 space-y-6 p-8 pt-6">
            <div className="flex items-center justify-between space-y-2">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight">Framework Templates</h2>
                    <p className="text-muted-foreground mt-1">Manage and configure your compliance questionnaires</p>
                </div>
                <div className="flex items-center space-x-2">
                    <Button>
                        <Plus className="mr-2 h-4 w-4" />
                        Create Framework
                    </Button>
                </div>
            </div>

            {isLoading ? (
                <div className="flex items-center justify-center p-24">
                    <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
                </div>
            ) : (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {frameworks?.map((framework) => (
                        <Card key={framework.id} className="cursor-pointer hover:border-primary/50 transition-colors">
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-lg font-medium">
                                    {framework.name}
                                </CardTitle>
                                <FileText className="h-4 w-4 text-muted-foreground" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-sm text-muted-foreground mb-4 font-mono">
                                    Version: {framework.version}
                                </div>
                                <p className="text-sm line-clamp-2 h-10 mb-4 text-slate-600 dark:text-slate-400">
                                    {framework.description || "No description provided."}
                                </p>
                                <div className="flex items-center justify-between mt-auto pt-4 border-t">
                                    <span className="text-xs text-muted-foreground">
                                        Updated: {framework.updated_at ? format(new Date(framework.updated_at), "MMM d, yyyy") : ""}
                                    </span>
                                    <Button variant="ghost" size="sm" className="h-8 gap-1">
                                        Configure <ArrowRight className="h-3 w-3" />
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                    {(!frameworks || frameworks.length === 0) && (
                        <div className="col-span-full border-2 border-dashed rounded-lg p-12 text-center">
                            <FileText className="h-10 w-10 text-muted-foreground mx-auto mb-4" />
                            <h3 className="text-lg font-semibold">No frameworks</h3>
                            <p className="text-muted-foreground mt-2">Create your first framework template to begin assessing vendors.</p>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
