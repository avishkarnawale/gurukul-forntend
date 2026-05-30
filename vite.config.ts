// @lovable.dev/vite-tanstack-config already includes the following — do NOT add them manually
// or the app will break with duplicate plugins:
//   - tanstackStart, viteReact, tailwindcss, tsConfigPaths, cloudflare (build-only),
//     componentTagger (dev-only), VITE_* env injection, @ path alias, React/TanStack dedupe,
//     error logger plugins, and sandbox detection (port/host/strictPort).
// You can pass additional config via defineConfig({ vite: { ... } }) if needed.
import { defineConfig } from "@lovable.dev/vite-tanstack-config";

// Redirect TanStack Start's bundled server entry to src/server.ts (our SSR error wrapper).
// @cloudflare/vite-plugin builds from this — wrangler.jsonc main alone is insufficient.
// Only switch to a static SPA build for production (`vite build`). Local dev
// (`vite dev`) keeps its normal SSR behavior so nothing changes while developing.
// The static SPA output (dist/client) is what Vercel/Netlify/Pages serve, and
// all data is fetched client-side from VITE_API_BASE_URL — no server runtime.
const isBuild = process.argv.includes("build");

export default defineConfig({
  cloudflare: false,
  tanstackStart: {
    server: { entry: "server" },
    ...(isBuild ? { spa: { enabled: true } } : {}),
  },
  // Split the big vendor bundle into separate, long-term-cacheable chunks so the
  // browser downloads them in parallel and reuses them across page loads/deploys.
  vite: {
    build: {
      rollupOptions: {
        output: {
          manualChunks(id) {
            if (!id.includes("node_modules")) return;
            if (id.includes("recharts") || id.includes("d3-") || id.includes("victory-vendor")) return "vendor-charts";
            if (id.includes("@radix-ui")) return "vendor-radix";
            if (id.includes("lucide-react")) return "vendor-icons";
            if (id.includes("@tanstack")) return "vendor-tanstack";
            if (id.includes("react-dom") || id.includes("/scheduler/")) return "vendor-react";
          },
        },
      },
    },
  },
});
