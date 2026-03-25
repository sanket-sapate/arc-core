import { NavLink } from "react-router";
import { LayoutDashboard, FileText, AlertTriangle, UserCheck } from "lucide-react";

export function PortalNav() {
    return (
        <nav className="flex items-center gap-4 bg-card border rounded-full px-6 py-3 shadow-sm mb-8 overflow-x-auto">
            <NavLink
                to="/portal/dashboard"
                end
                className={({ isActive }) =>
                    `flex items-center gap-2 whitespace-nowrap text-sm font-medium transition-colors ${isActive ? "text-primary" : "text-muted-foreground hover:text-primary"
                    }`
                }
            >
                <LayoutDashboard className="w-4 h-4" /> Dashboard
            </NavLink>

            <NavLink
                to="/portal/requests"
                className={({ isActive }) =>
                    `flex items-center gap-2 whitespace-nowrap text-sm font-medium transition-colors ${isActive ? "text-primary" : "text-muted-foreground hover:text-primary"
                    }`
                }
            >
                <FileText className="w-4 h-4" /> DSAR Requests
            </NavLink>

            <NavLink
                to="/portal/grievances"
                className={({ isActive }) =>
                    `flex items-center gap-2 whitespace-nowrap text-sm font-medium transition-colors ${isActive ? "text-primary" : "text-muted-foreground hover:text-primary"
                    }`
                }
            >
                <AlertTriangle className="w-4 h-4" /> Grievances
            </NavLink>

            <NavLink
                to="/portal/nominees"
                className={({ isActive }) =>
                    `flex items-center gap-2 whitespace-nowrap text-sm font-medium transition-colors ${isActive ? "text-primary" : "text-muted-foreground hover:text-primary"
                    }`
                }
            >
                <UserCheck className="w-4 h-4" /> Nominees
            </NavLink>
        </nav>
    );
}
