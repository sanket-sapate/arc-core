import { type RouteConfig, index, layout, route } from "@react-router/dev/routes";

export default [
    // ── Public Landing Page ────────────────────────────────────────────────
    index("routes/_index.tsx"),

    // ── Routes wrapped in the authenticated AppLayout ──────────────────────
    layout("components/layout/AppLayout.tsx", [
        // Admin Application Namespace
        route("app", "routes/app.dashboard.tsx"),
        route("app/dashboard", "routes/app.dashboard.tsx", { id: "app-dashboard-duplicate" }),

        // Data Intelligence
        route("app/data-intelligence/discovery", "routes/app.data-intelligence.discovery.tsx"),
        route("app/data-intelligence/cookie-scanner", "routes/app.data-intelligence.cookie-scanner.tsx"),
        route("app/data-intelligence/sources", "routes/app.data-intelligence.sources.tsx"),
        route("app/data-intelligence/jobs", "routes/app.data-intelligence.jobs.tsx"),
        route("app/data-intelligence/dictionary", "routes/app.data-intelligence.dictionary.tsx"),
        route("app/data-intelligence/mapping", "routes/app.data-intelligence.mapping.tsx"),

        // Consent Management
        route("app/consent/banners", "routes/app.consent.banners.tsx"),
        route("app/consent/forms", "routes/app.consent.forms.tsx"),
        route("app/consent/purposes", "routes/app.consent.purposes.tsx"),
        route("app/consent/script-blocking", "routes/app.consent.script-blocking.tsx"),

        // Privacy Operations
        route("app/privacy-ops/ropa", "routes/app.privacy-ops.ropa.tsx"),
        route("app/privacy-ops/dpia", "routes/app.privacy-ops.dpia.tsx"),
        route("app/privacy-ops/dsr", "routes/app.privacy-ops.dsr.tsx"),
        route("app/privacy-ops/breaches", "routes/app.privacy-ops.breaches.tsx"),

        // Third-Party Risk
        route("app/third-party-risk/vendors", "routes/app.third-party-risk.vendors.tsx"),
        route("app/third-party-risk/assessments", "routes/app.third-party-risk.assessments.tsx"),
        route("app/third-party-risk/frameworks", "routes/app.third-party-risk.frameworks.tsx"),
        route("app/third-party-risk/frameworks/:id", "routes/app.third-party-risk.frameworks.$id.tsx"),
        route("app/third-party-risk/dpas", "routes/app.third-party-risk.dpas.tsx"),

        route("app/third-party-risk/assessments/:id", "routes/app.third-party-risk.assessments.$id.tsx"),

        // Administration
        route("app/settings/integrations", "routes/app.settings.integrations.tsx"),
        route("app/settings/roles", "routes/app.settings.roles.tsx"),
        route("app/admin/access", "routes/app.admin.access.tsx"),
        route("app/admin/developer", "routes/app.admin.developer.tsx"),
        route("app/admin/audit", "routes/app.admin.audit.tsx"),
    ]),

    // ── Non-layout routes (public) ─────────────────────────────────────────
    route("auth/callback", "routes/auth.callback.tsx"),
    route("ingress-test", "routes/ingress-test.tsx"),

    // ── User Portal Routes ───────────────────────────────────────────────
    route("portal/login", "routes/portal.login.tsx"),
    route("portal/verify", "routes/portal.verify.tsx"),
    route("portal/dashboard", "routes/portal.dashboard.tsx"),
    route("portal/requests", "routes/portal.requests.tsx"),
    route("portal/grievances", "routes/portal.grievances.tsx"),
    route("portal/nominees", "routes/portal.nominee.tsx"),

    // ── Catch-all 404 Boundary ─────────────────────────────────────────────
    route("*", "routes/not-found.tsx"),
] satisfies RouteConfig;
