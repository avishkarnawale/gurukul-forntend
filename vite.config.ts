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
});
