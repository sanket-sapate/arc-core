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
    KeyRound,
    History,
    ChevronRight,
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
        href: '/',
        icon: LayoutDashboard,
    },
    {
        title: 'Data Intelligence',
        icon: Search,
        children: [
            { title: 'Dashboard', href: '/data-intelligence/discovery' },
            { title: 'Cookie Scanner', href: '/data-intelligence/cookie-scanner' },
            { title: 'Data Sources', href: '/data-intelligence/sources' },
            { title: 'Scan History', href: '/data-intelligence/jobs' },
            // { title: 'Profiles & Rules', href: '/data-intelligence/profiles' },
            { title: 'Data Dictionary', href: '/data-intelligence/dictionary' },
        ],
    },
    {
        title: 'Consent Management',
        icon: Cookie,
        children: [
            { title: 'Cookie Banners', href: '/consent/banners' },
            { title: 'Purposes', href: '/consent/purposes' },
            { title: 'Consent Forms', href: '/consent/forms' },
            { title: 'Script Blocking', href: '/consent/script-blocking' },
        ],
    },
    {
        title: 'Privacy Operations',
        icon: ShieldAlert,
        children: [
            { title: 'ROPA', href: '/privacy-ops/ropa' },
            { title: 'DPIAs', href: '/privacy-ops/dpia' },
            { title: 'Subject Requests', href: '/privacy-ops/dsr' },
            { title: 'Breaches', href: '/privacy-ops/breaches' },
        ],
    },
    {
        title: 'Third-Party Risk',
        icon: Building2,
        children: [
            { title: 'Vendors', href: '/third-party-risk/vendors' },
            { title: 'Assessments', href: '/third-party-risk/assessments' },
            { title: 'Frameworks', href: '/third-party-risk/frameworks' },
            { title: 'DPAs', href: '/third-party-risk/dpas' },
        ],
    },
];

const adminNav: NavItem[] = [
    {
        title: 'Administration',
        icon: Users,
        children: [
            { title: 'Users & Roles', href: '/admin/access' },
            { title: 'API Keys', href: '/admin/developer' },
            { title: 'Integrations', href: '/settings/integrations' },
            { title: 'Audit Logs', href: '/admin/audit' },
        ],
    },
];

// ── Component ──────────────────────────────────────────────────────────────

export function AppSidebar() {
    const org = useSessionStore((s) => s.activeOrganization);
    const location = useLocation();

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
                <p className="truncate text-xs text-muted-foreground">© 2026 ARC Platform</p>
            </SidebarFooter>

            <SidebarRail />
        </Sidebar>
    );
}
