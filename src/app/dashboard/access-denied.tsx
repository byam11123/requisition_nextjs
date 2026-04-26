"use client";

import Link from "next/link";
import { ShieldAlert } from "lucide-react";

type AccessDeniedProps = {
  href: string;
};

export default function AccessDenied({ href }: AccessDeniedProps) {
  return (
    <div className="flex min-h-[70vh] items-center justify-center px-4">
      <div className="w-full max-w-lg rounded-3xl border border-white/5 bg-slate-900/60 p-8 text-center">
        <div className="mx-auto inline-flex rounded-2xl border border-amber-500/20 bg-amber-500/10 p-3 text-amber-300">
          <ShieldAlert size={22} />
        </div>
        <h1 className="mt-5 text-2xl font-semibold text-slate-100">
          Access Restricted
        </h1>
        <p className="mt-3 text-sm text-slate-400">
          This page is not available for your role. Use a page that is assigned
          to your workflow instead.
        </p>
        <div className="mt-6">
          <Link
            href={href}
            className="inline-flex items-center justify-center rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-indigo-500"
          >
            Go To Allowed Page
          </Link>
        </div>
      </div>
    </div>
  );
}

