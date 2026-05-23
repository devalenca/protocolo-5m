import { ConvexAuthNextjsServerProvider } from "@convex-dev/auth/nextjs/server";
import type { Metadata, Viewport } from "next";
import { EB_Garamond, Inter } from "next/font/google";
import Script from "next/script";
import { CommandPalette } from "@/components/layout/CommandPalette";
import { MobileDock } from "@/components/layout/MobileDock";
import { Sidebar } from "@/components/layout/Sidebar";
import { ThemeProvider } from "@/components/layout/theme-provider";
import { TopBar } from "@/components/layout/TopBar";
import { ConvexClientProvider } from "@/components/providers/ConvexClientProvider";
import { OnboardingGate } from "@/components/providers/OnboardingGate";
import { ToastProvider } from "@/components/ui/Toast";
import { buildThemeScript } from "@/lib/theme";
import "./globals.css";

const serif = EB_Garamond({
  variable: "--font-serif-family",
  subsets: ["latin"],
  display: "swap",
  weight: ["400", "500", "600", "700"],
});

const sans = Inter({
  variable: "--font-sans-family",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Protocolo 5M",
  description:
    "Protocolo pessoal de recomposição corporal — checklist diário, treinos, recordes e coach com IA.",
  applicationName: "Protocolo 5M",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Protocolo",
  },
  formatDetection: { telephone: false },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#faf8f3" },
    { media: "(prefers-color-scheme: dark)", color: "#0a0a0a" },
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ConvexAuthNextjsServerProvider>
      <html
        lang="pt-BR"
        className={`${serif.variable} ${sans.variable}`}
        suppressHydrationWarning
      >
        <body className="bg-bg text-text min-h-dvh">
          <Script id="theme-init" strategy="beforeInteractive">
            {buildThemeScript()}
          </Script>
          <ConvexClientProvider>
            <ThemeProvider>
              <ToastProvider>
                <OnboardingGate>
                <Sidebar />
                <TopBar />
                <main
                  className="mx-auto w-full px-4 lg:ml-[260px] lg:max-w-3xl lg:px-8 lg:pt-10"
                  style={
                    {
                      "--mobile-top": "calc(56px + var(--safe-top))",
                      "--mobile-bottom": "calc(80px + var(--safe-bottom) + 16px)",
                    } as React.CSSProperties
                  }
                >
                  <div className="pt-[var(--mobile-top)] pb-[var(--mobile-bottom)] lg:pt-0 lg:pb-12">
                    <div className="mx-auto w-full max-w-md lg:max-w-2xl">{children}</div>
                  </div>
                </main>
                <MobileDock />
                <CommandPalette />
                </OnboardingGate>
              </ToastProvider>
            </ThemeProvider>
          </ConvexClientProvider>
        </body>
      </html>
    </ConvexAuthNextjsServerProvider>
  );
}
