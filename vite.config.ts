
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
  },
  plugins: [
    react(),
    mode === 'development' &&
    componentTagger(),
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  base: "/",
  build: {
    rollupOptions: {
      external: ['critical'], // Explicitly mark critical as external
      output: {
        manualChunks: undefined,
      },
    },
    commonjsOptions: {
      include: [/critical/, /node_modules/], // Include critical in commonjs processing
    },
  },
  optimizeDeps: {
    include: ['critical'], // Include critical in dependency optimization
  },
}));
