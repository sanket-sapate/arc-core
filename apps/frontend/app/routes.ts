import { type RouteConfig, index, layout, route } from "@react-router/dev/routes";

export default [
    // ── Routes wrapped in the authenticated AppLayout ──────────────────────
    layout("components/layout/AppLayout.tsx", [
        // Dashboard (index route)
        index("routes/dashboard.tsx"),

        // Data Intelligence
        route("data-intelligence/discovery", "routes/data-intelligence.discovery.tsx"),
        route("data-intelligence/cookie-scanner", "routes/data-intelligence.cookie-scanner.tsx"),
        route("data-intelligence/sources", "routes/data-intelligence.sources.tsx"),
        route("data-intelligence/jobs", "routes/data-intelligence.jobs.tsx"),
        // route("data-intelligence/profiles", "routes/data-intelligence.profiles.tsx"),
        route("data-intelligence/dictionary", "routes/data-intelligence.dictionary.tsx"),

        // Consent Management
        route("consent/banners", "routes/consent.banners.tsx"),
        route("consent/forms", "routes/consent.forms.tsx"),
        route("consent/purposes", "routes/consent.purposes.tsx"),
        route("consent/script-blocking", "routes/consent.script-blocking.tsx"),

        // Privacy Operations
        route("privacy-ops/ropa", "routes/privacy-ops.ropa.tsx"),
        route("privacy-ops/dpia", "routes/privacy-ops.dpia.tsx"),
        route("privacy-ops/dsr", "routes/privacy-ops.dsr.tsx"),
        route("privacy-ops/breaches", "routes/privacy-ops.breaches.tsx"),

        // Third-Party Risk
        route("third-party-risk/vendors", "routes/third-party-risk.vendors.tsx"),
        route("third-party-risk/assessments", "routes/third-party-risk.assessments.tsx"),
        route("third-party-risk/frameworks", "routes/third-party-risk.frameworks.tsx"),
        route("third-party-risk/dpas", "routes/third-party-risk.dpas.tsx"),

        // Administration
        route("settings/integrations", "routes/settings.integrations.tsx"),
        route("admin/access", "routes/admin.access.tsx"),
        route("admin/developer", "routes/admin.developer.tsx"),
        route("admin/audit", "routes/admin.audit.tsx"),
    ]),

    // ── Non-layout routes (public) ─────────────────────────────────────────
    route("auth/callback", "routes/auth.callback.tsx"),
    route("ingress-test", "routes/ingress-test.tsx"),
] satisfies RouteConfig;
