import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // better-sqlite3 es un módulo nativo: se carga tal cual en el servidor, sin empaquetarlo.
  serverExternalPackages: ["better-sqlite3"],
};

export default nextConfig;
