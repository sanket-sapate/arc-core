import { NavLink } from "react-router";
import { LayoutDashboard, FileText, AlertTriangle, UserCheck } from "lucide-react";

export function PortalNav() {
    return (
        <nav className="flex items-center gap-4 bg-white border border-slate-200 rounded-full px-6 py-3 shadow-sm mb-8 overflow-x-auto">
            <NavLink
                to="/portal/dashboard"
                end
                className={({ isActive }) =>
                    `flex items-center gap-2 whitespace-nowrap text-sm font-medium transition-colors ${isActive ? "text-indigo-600" : "text-slate-600 hover:text-indigo-600"
                    }`
                }
            >
                <LayoutDashboard className="w-4 h-4" /> Dashboard
            </NavLink>

            <NavLink
                to="/portal/requests"
                className={({ isActive }) =>
                    `flex items-center gap-2 whitespace-nowrap text-sm font-medium transition-colors ${isActive ? "text-indigo-600" : "text-slate-600 hover:text-indigo-600"
                    }`
                }
            >
                <FileText className="w-4 h-4" /> DSAR Requests
            </NavLink>

            <NavLink
                to="/portal/grievances"
                className={({ isActive }) =>
                    `flex items-center gap-2 whitespace-nowrap text-sm font-medium transition-colors ${isActive ? "text-indigo-600" : "text-slate-600 hover:text-indigo-600"
                    }`
                }
            >
                <AlertTriangle className="w-4 h-4" /> Grievances
            </NavLink>

            <NavLink
                to="/portal/nominees"
                className={({ isActive }) =>
                    `flex items-center gap-2 whitespace-nowrap text-sm font-medium transition-colors ${isActive ? "text-indigo-600" : "text-slate-600 hover:text-indigo-600"
                    }`
                }
            >
                <UserCheck className="w-4 h-4" /> Nominees
            </NavLink>
        </nav>
    );
}
