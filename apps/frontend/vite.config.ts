import { reactRouter } from "@react-router/dev/vite";
import tailwindcss from "@tailwindcss/vite";
import { defineConfig } from "vite";
import tsconfigPaths from "vite-tsconfig-paths";

export default defineConfig({
  plugins: [tailwindcss(), reactRouter(), tsconfigPaths()],
  server: {
    proxy: {
      // Forward public CMP widget API requests to the public-api-service
      '/api/v1/public': {
        target: 'http://localhost:8080',
        changeOrigin: true,
      },
    },
  },
});
