import { type RouteConfig, index, route } from "@react-router/dev/routes";

export default [
    index("routes/home.tsx"),
    route("ingress-test", "routes/ingress-test.tsx"),
] satisfies RouteConfig;
