import { type MetaFunction } from "react-router";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "~/components/ui/card";
import { Button } from "~/components/ui/button";
import { Switch } from "~/components/ui/switch";
import { Badge } from "~/components/ui/badge";
import { Slack, Webhook, Box, Grid } from "lucide-react";
import { useState } from "react";

export const meta: MetaFunction = () => {
    return [
        { title: "Integrations | ARC Settings" },
        { name: "description", content: "Manage third-party tool integrations" },
    ];
};

interface Integration {
    id: string;
    name: string;
    description: string;
    icon: React.ReactNode;
    category: string;
    status: "connected" | "disconnected";
}

const INITIAL_INTEGRATIONS: Integration[] = [
    {
        id: "slack",
        name: "Slack",
        description: "Receive notifications and DSR alerts directly in your Slack channels.",
        icon: <Slack className="w-8 h-8 text-indigo-500" />,
        category: "Communication",
        status: "connected",
    },
    {
        id: "jira",
        name: "Jira / Atlassian",
        description: "Automatically create Jira issues for privacy breaches and assessment reviews.",
        icon: <Grid className="w-8 h-8 text-blue-500" />,
        category: "Ticketing",
        status: "disconnected",
    },
    {
        id: "keycloak",
        name: "Keycloak SSO",
        description: "Synchronize organizational roles and manage Single Sign-On policies natively.",
        icon: <Box className="w-8 h-8 text-orange-500" />,
        category: "Identity",
        status: "connected",
    },
    {
        id: "webhooks",
        name: "Universal Webhooks",
        description: "Configure custom HTTP endpoints to ingest real-time platform event triggers.",
        icon: <Webhook className="w-8 h-8 text-purple-500" />,
        category: "Developer",
        status: "disconnected",
    }
];

export default function IntegrationsPage() {
    const [integrations, setIntegrations] = useState<Integration[]>(INITIAL_INTEGRATIONS);

    const toggleIntegration = (id: string, currentStatus: string) => {
        setIntegrations(prev => prev.map(integration =>
            integration.id === id
                ? { ...integration, status: currentStatus === "connected" ? "disconnected" : "connected" }
                : integration
        ));
    };

    return (
        <div className="flex-1 space-y-6 p-8 pt-6 max-w-7xl mx-auto">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Integrations</h1>
                    <p className="text-muted-foreground mt-1 text-sm">
                        Connect ARC to your existing tools and automate your compliance workflows.
                    </p>
                </div>
            </div>

            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3">
                {integrations.map((integration) => (
                    <Card key={integration.id} className="flex flex-col">
                        <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2">
                            <div className="bg-slate-100 dark:bg-slate-800 p-3 rounded-lg">
                                {integration.icon}
                            </div>
                            <Switch
                                checked={integration.status === "connected"}
                                onCheckedChange={() => toggleIntegration(integration.id, integration.status)}
                            />
                        </CardHeader>
                        <CardContent className="pt-4 flex-1">
                            <CardTitle className="text-xl">{integration.name}</CardTitle>
                            <Badge variant="secondary" className="mt-2 mb-3 text-xs bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400">
                                {integration.category}
                            </Badge>
                            <CardDescription className="text-sm">
                                {integration.description}
                            </CardDescription>
                        </CardContent>
                        <CardFooter className="flex justify-between items-center border-t pt-4">
                            {integration.status === "connected" ? (
                                <Badge className="bg-green-100 text-green-800 hover:bg-green-100 font-normal">
                                    <span className="w-1.5 h-1.5 rounded-full bg-green-600 mr-1.5 animate-pulse"></span>
                                    Connected
                                </Badge>
                            ) : (
                                <Badge variant="outline" className="text-muted-foreground font-normal">
                                    Disconnected
                                </Badge>
                            )}

                            {integration.status === "connected" && (
                                <Button variant="ghost" size="sm" className="h-8">Configure</Button>
                            )}
                        </CardFooter>
                    </Card>
                ))}
            </div>

            <div className="mt-8 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-8 flex flex-col items-center justify-center text-center">
                <Box className="w-12 h-12 text-slate-300 dark:text-slate-700 mb-4" />
                <h3 className="text-lg font-semibold mb-2">Need a custom integration?</h3>
                <p className="text-muted-foreground mb-4 max-w-md">
                    Our team can help you connect ARC directly with your proprietary internal systems or niche compliance tools using our Developer API.
                </p>
                <Button variant="outline">View API Documentation</Button>
            </div>
        </div>
    );
}
