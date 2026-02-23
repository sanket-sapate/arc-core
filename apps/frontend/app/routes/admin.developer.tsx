import DeveloperSettingsPage from "./settings.developer";
import { type MetaFunction } from "react-router";

export const meta: MetaFunction = () => {
    return [
        { title: "API Keys | ARC Admin" },
        { name: "description", content: "Manage system-wide programmatic access." },
    ];
};

export default function DeveloperPage() {
    return <DeveloperSettingsPage />;
}
