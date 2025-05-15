import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import wasm from "vite-plugin-wasm";
import topLevelAwait from "vite-plugin-top-level-await";

// https://vite.dev/config/
export default defineConfig({
    plugins: [react(), wasm(), topLevelAwait()],

    server: {
        fs: {
            allow: ["../pkg", "./"],
        },
    },

    // Below is set according to https://github.com/Menci/vite-plugin-wasm#usage
    // to support top-level `await`s
    build: {
        target: "esnext",
    },

    // Handle client-side routing during development and production
    preview: {
        port: 5173,
    }
});
