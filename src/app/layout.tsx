import type { Metadata } from "next";
import localFont from "next/font/local";
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
    <html lang="en">
      <body className={`${expose.variable} bg-slate-950 text-slate-100 min-h-screen antialiased selection:bg-indigo-500 selection:text-white`}>
        {/* Ambient background decoration */}
        <div className="fixed inset-0 min-h-screen bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-indigo-900/40 via-slate-950 to-slate-950 -z-10" />
        
        {children}
      </body>
    </html>
  );
}
