"use client";

import Link from "next/link";
import { ArrowRight, BookMarked, PhoneCall, Wrench } from "lucide-react";

export default function ContactManagerPage() {
  return (
    <div className="animate-fade-in-up space-y-6">
      <div>
        <div className="inline-flex items-center gap-2 rounded-full border border-indigo-500/20 bg-indigo-500/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.2em] text-indigo-300">
          <BookMarked size={14} />
          Coming Soon
        </div>
        <h1 className="mt-4 text-2xl font-bold text-slate-100">
          Contact Manager
        </h1>
        <p className="mt-2 max-w-3xl text-sm text-slate-400">
          This is a saved bookmark for the shared office and staff contact
            module. We will implement it later so Repair &amp; Maintenance can
          reuse saved contact details instead of manual entry every time.
        </p>
      </div>

      <div className="grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
        <div className="rounded-3xl border border-white/5 bg-slate-900/50 p-6">
          <div className="inline-flex rounded-2xl border border-indigo-500/20 bg-indigo-500/10 p-3 text-indigo-300">
            <PhoneCall size={20} />
          </div>
          <h2 className="mt-5 text-lg font-semibold text-slate-100">
            Planned Here Later
          </h2>
          <div className="mt-4 space-y-3 text-sm text-slate-400">
            <p>Shared employee and office contact register.</p>
            <p>Multiple mobile numbers for each contact.</p>
            <p>Saved contact data reused in repair workflows.</p>
            <p>Cleaner repair forms with less repeated typing.</p>
          </div>
        </div>

        <div className="rounded-3xl border border-white/5 bg-slate-900/50 p-6">
          <div className="inline-flex rounded-2xl border border-emerald-500/20 bg-emerald-500/10 p-3 text-emerald-300">
            <Wrench size={20} />
          </div>
          <h2 className="mt-5 text-lg font-semibold text-slate-100">
            Target Integration
          </h2>
          <p className="mt-3 text-sm text-slate-400">
            Later, the repair module will fetch selected contact data from here
            so we do not enter the same phone details again and again.
          </p>

          <div className="mt-6">
            <Link
              href="/dashboard/repair-maintainance"
              className="inline-flex items-center gap-2 rounded-xl border border-white/10 px-4 py-2.5 text-sm text-slate-300 transition-colors hover:bg-white/5"
            >
            Open Repair &amp; Maintenance
              <ArrowRight size={15} />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
