import type { Metadata } from "next";
import { DemoBanner, DemoFooter } from "@/components/demo/DemoPages";
import { Nav } from "@/components/Nav";
import { IS_DEMO } from "@/lib/mode";
import "./globals.css";

export const metadata: Metadata = {
  title: "Job Tracker",
  description: "Seguimiento de solicitudes de empleo",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body className="min-h-screen bg-slate-50 text-slate-900 antialiased">
        {IS_DEMO && <DemoBanner />}
        <Nav />
        <main className="mx-auto max-w-6xl px-4 py-8">{children}</main>
        {IS_DEMO && <DemoFooter />}
      </body>
    </html>
  );
}
