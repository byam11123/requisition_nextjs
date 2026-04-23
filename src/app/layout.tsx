import type { Metadata } from "next";
import localFont from "next/font/local";
import AppContentShell from "./app-content-shell";
import AppFooter from "./app-footer";
import { ThemeProvider } from "./theme-provider";
import "./globals.css";

const expose = localFont({
  src: "../../public/fonts/expose/Expose-Variable.woff2",
  variable: "--font-expose",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Requisition App Next",
  description: "A Multi-Tenant SaaS Requisition Management System",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${expose.variable} app-body min-h-screen antialiased`}>
        <ThemeProvider>
          <div className="app-ambient" />
          <AppContentShell>
            {children}
          </AppContentShell>
          <AppFooter
            mode="non-dashboard"
            className="fixed inset-x-0 bottom-0 z-40 border-t border-[var(--app-border)] bg-[var(--app-surface-strong)] px-4 py-3 text-center backdrop-blur-xl"
          />
        </ThemeProvider>
      </body>
    </html>
  );
}
