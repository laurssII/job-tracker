import type { Metadata } from "next";
import { DemoBanner, DemoFooter } from "@/components/demo/DemoPages";
import { Nav } from "@/components/Nav";
import { getDictionary } from "@/i18n/dictionaries";
import { LanguageProvider } from "@/i18n/LanguageProvider";
import { getServerLang } from "@/i18n/server";
import { IS_DEMO } from "@/lib/mode";
import { THEME_SCRIPT } from "@/theme/script";
import "./globals.css";

export async function generateMetadata(): Promise<Metadata> {
  const lang = await getServerLang();
  return { title: "Job Tracker", description: getDictionary(lang).meta.description };
}

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const lang = await getServerLang();

  return (
    // suppressHydrationWarning: el script del <head> añade data-theme antes de que React hidrate.
    <html lang={lang} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: THEME_SCRIPT }} />
      </head>
      <body className="min-h-screen bg-slate-50 text-slate-900 antialiased">
        <LanguageProvider initialLang={lang}>
          {IS_DEMO && <DemoBanner />}
          <Nav />
          <main className="mx-auto max-w-6xl px-4 py-8">{children}</main>
          {IS_DEMO && <DemoFooter />}
        </LanguageProvider>
      </body>
    </html>
  );
}
