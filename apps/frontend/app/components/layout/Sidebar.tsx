import { NavLink, useLocation } from 'react-router';
import {
    LayoutDashboard,
    Search,
    BookOpen,
    Cookie,
    FileText,
    Target,
    ScrollText,
    ShieldAlert,
    Mail,
    Flame,
    Building2,
    ClipboardCheck,
    FileSignature,
    Users,
    History,
    ChevronRight,
    LogOut,
} from 'lucide-react';
import {
    Sidebar,
    SidebarContent,
    SidebarFooter,
    SidebarGroup,
    SidebarGroupLabel,
    SidebarHeader,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
    SidebarMenuSub,
    SidebarMenuSubButton,
    SidebarMenuSubItem,
    SidebarRail,
} from '~/components/ui/sidebar';
import {
    Collapsible,
    CollapsibleContent,
    CollapsibleTrigger,
} from '~/components/ui/collapsible';
import { useSessionStore } from '~/store/session';
import { useAuth } from 'react-oidc-context';

// ── Navigation data ────────────────────────────────────────────────────────

interface NavItem {
    title: string;
    href?: string;
    icon: React.ElementType;
    children?: { title: string; href: string }[];
}

const mainNav: NavItem[] = [
    {
        title: 'Dashboard',
        href: '/app/dashboard',
        icon: LayoutDashboard,
    },
    {
        title: 'Data Intelligence',
        icon: Search,
        children: [
            { title: 'Dashboard', href: '/app/data-intelligence/discovery' },
            { title: 'Cookie Scanner', href: '/app/data-intelligence/cookie-scanner' },
            { title: 'Data Sources', href: '/app/data-intelligence/sources' },
            { title: 'Scan History', href: '/app/data-intelligence/jobs' },
            // { title: 'Profiles & Rules', href: '/app/data-intelligence/profiles' },
            { title: 'Data Dictionary', href: '/app/data-intelligence/dictionary' },
            { title: 'Classification Review', href: '/app/data-intelligence/mapping' },
        ],
    },
    {
        title: 'Consent Management',
        icon: Cookie,
        children: [
            { title: 'Cookie Banners', href: '/app/consent/banners' },
            { title: 'Purposes', href: '/app/consent/purposes' },
            { title: 'Consent Forms', href: '/app/consent/forms' },
            { title: 'Script Blocking', href: '/app/consent/script-blocking' },
        ],
    },
    {
        title: 'Privacy Operations',
        icon: ShieldAlert,
        children: [
            { title: 'ROPA', href: '/app/privacy-ops/ropa' },
            { title: 'DPIAs', href: '/app/privacy-ops/dpia' },
            { title: 'Subject Requests', href: '/app/privacy-ops/dsr' },
            { title: 'Breaches', href: '/app/privacy-ops/breaches' },
        ],
    },
    {
        title: 'Third-Party Risk',
        icon: Building2,
        children: [
            { title: 'Vendors', href: '/app/third-party-risk/vendors' },
            { title: 'Assessments', href: '/app/third-party-risk/assessments' },
            { title: 'Frameworks', href: '/app/third-party-risk/frameworks' },
            { title: 'DPAs', href: '/app/third-party-risk/dpas' },
        ],
    },
];

const adminNav: NavItem[] = [
    {
        title: 'Administration',
        icon: Users,
        children: [
            { title: 'Users & Roles', href: '/app/admin/access' },
            { title: 'Roles & Permissions', href: '/app/settings/roles' },
            { title: 'API Keys', href: '/app/admin/developer' },
            { title: 'Integrations', href: '/app/settings/integrations' },
            { title: 'Audit Logs', href: '/app/admin/audit' },
        ],
    },
];

// ── Component ──────────────────────────────────────────────────────────────

export function AppSidebar() {
    const org = useSessionStore((s) => s.activeOrganization);
    const location = useLocation();
    const auth = useAuth();
    const navigate = (path: string) => {
        window.location.href = path;
    };

    /** True when any child route is active */
    const isGroupActive = (items: { href: string }[]) =>
        items.some((i) => location.pathname.startsWith(i.href));

    return (
        <Sidebar collapsible="icon" variant="sidebar">
            {/* ── Header / Branding ─────────────────────────────────────── */}
            <SidebarHeader className="border-b border-sidebar-border px-4 py-3">
                <div className="flex items-center gap-2 overflow-hidden">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-primary text-primary-foreground text-sm font-bold">
                        A
                    </div>
                    <div className="flex flex-col overflow-hidden leading-tight">
                        <span className="truncate text-sm font-semibold">ARC Platform</span>
                        <span className="truncate text-xs text-muted-foreground">
                            {org?.name ?? 'No organization'}
                        </span>
                    </div>
                </div>
            </SidebarHeader>

            {/* ── Main navigation ───────────────────────────────────────── */}
            <SidebarContent>
                <SidebarGroup>
                    <SidebarGroupLabel>Main Menu</SidebarGroupLabel>
                    <SidebarMenu>
                        {mainNav.map((item) =>
                            item.href ? (
                                <SidebarMenuItem key={item.title}>
                                    <SidebarMenuButton
                                        asChild
                                        isActive={location.pathname === item.href}
                                        tooltip={item.title}
                                    >
                                        <NavLink to={item.href}>
                                            <item.icon />
                                            <span>{item.title}</span>
                                        </NavLink>
                                    </SidebarMenuButton>
                                </SidebarMenuItem>
                            ) : (
                                <Collapsible
                                    key={item.title}
                                    asChild
                                    defaultOpen={true}
                                    className="group/collapsible"
                                >
                                    <SidebarMenuItem>
                                        <CollapsibleTrigger asChild>
                                            <SidebarMenuButton tooltip={item.title}>
                                                <item.icon />
                                                <span>{item.title}</span>
                                                <ChevronRight className="ml-auto transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90" />
                                            </SidebarMenuButton>
                                        </CollapsibleTrigger>
                                        <CollapsibleContent>
                                            <SidebarMenuSub>
                                                {item.children!.map((child) => (
                                                    <SidebarMenuSubItem key={child.href}>
                                                        <SidebarMenuSubButton
                                                            asChild
                                                            isActive={location.pathname === child.href}
                                                        >
                                                            <NavLink to={child.href}>{child.title}</NavLink>
                                                        </SidebarMenuSubButton>
                                                    </SidebarMenuSubItem>
                                                ))}
                                            </SidebarMenuSub>
                                        </CollapsibleContent>
                                    </SidebarMenuItem>
                                </Collapsible>
                            ),
                        )}
                    </SidebarMenu>
                </SidebarGroup>

                {/* ── Administration (pushed to bottom via mt-auto) ────────── */}
                <SidebarGroup className="mt-auto">
                    <SidebarGroupLabel>Administration</SidebarGroupLabel>
                    <SidebarMenu>
                        {adminNav.map((item) => (
                            <Collapsible
                                key={item.title}
                                asChild
                                defaultOpen={true}
                                className="group/collapsible"
                            >
                                <SidebarMenuItem>
                                    <CollapsibleTrigger asChild>
                                        <SidebarMenuButton tooltip={item.title}>
                                            <item.icon />
                                            <span>{item.title}</span>
                                            <ChevronRight className="ml-auto transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90" />
                                        </SidebarMenuButton>
                                    </CollapsibleTrigger>
                                    <CollapsibleContent>
                                        <SidebarMenuSub>
                                            {item.children!.map((child) => (
                                                <SidebarMenuSubItem key={child.href}>
                                                    <SidebarMenuSubButton
                                                        asChild
                                                        isActive={location.pathname === child.href}
                                                    >
                                                        <NavLink to={child.href}>{child.title}</NavLink>
                                                    </SidebarMenuSubButton>
                                                </SidebarMenuSubItem>
                                            ))}
                                        </SidebarMenuSub>
                                    </CollapsibleContent>
                                </SidebarMenuItem>
                            </Collapsible>
                        ))}
                    </SidebarMenu>
                </SidebarGroup>
            </SidebarContent>

            <SidebarFooter className="border-t border-sidebar-border px-4 py-2">
                <SidebarMenu>
                    <SidebarMenuItem>
                        <SidebarMenuButton
                            className="w-full justify-start text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/50"
                            onClick={() => {
                                if (window.location.pathname.startsWith('/portal')) {
                                    // Portal Logout: Clear Magic Link session and redirect
                                    document.cookie = 'auth_token=; Max-Age=0; path=/;';
                                    localStorage.removeItem('portal_user');
                                    navigate('/portal/login');
                                } else {
                                    // Admin Logout: Trigger Keycloak OIDC flow
                                    auth.removeUser();
                                    auth.signoutRedirect({ post_logout_redirect_uri: window.location.origin + '/app' });
                                }
                            }}
                        >
                            <LogOut className="mr-2 h-4 w-4" />
                            <span>Log out</span>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                </SidebarMenu>
                <div className="mt-2 text-center w-full">
                    <p className="truncate text-xs text-muted-foreground">© 2026 ARC Platform</p>
                </div>
            </SidebarFooter>

            <SidebarRail />
        </Sidebar>
    );
}
