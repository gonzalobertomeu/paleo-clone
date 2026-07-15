import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// SPA React empaquetada con Vite (ARCH-2.2). Puerto 5173 (ARCH-6.8).
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    host: true, // accesible desde el contenedor (ARCH-6.3)
  },
});
