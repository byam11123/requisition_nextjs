"use client";

import React, { Component, ErrorInfo, ReactNode } from "react";
import { AlertCircle, RefreshCcw, Home } from "lucide-react";
import Link from "next/link";

interface Props {
  children?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class GlobalErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Uncaught error:", error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="flex min-h-screen flex-col items-center justify-center bg-slate-950 p-6 text-center text-white">
          <div className="relative mb-8 flex h-24 w-24 items-center justify-center rounded-3xl bg-rose-500/10 text-rose-500 ring-1 ring-rose-500/20">
            <AlertCircle size={48} />
            <div className="absolute -inset-4 animate-pulse rounded-full bg-rose-500/5 blur-2xl" />
          </div>
          
          <h1 className="text-3xl font-bold tracking-tight text-white mb-3">Something went wrong</h1>
          <p className="max-w-md text-slate-400 mb-8 leading-relaxed">
            The application encountered an unexpected error. We've logged the incident and our team is looking into it.
          </p>

          <div className="flex flex-col sm:flex-row gap-4">
            <button
              onClick={() => window.location.reload()}
              className="flex items-center justify-center gap-2 rounded-2xl bg-indigo-600 px-6 py-3 font-semibold text-white shadow-lg shadow-indigo-600/20 transition-all hover:bg-indigo-500 active:scale-95"
            >
              <RefreshCcw size={18} /> Reload Application
            </button>
            <Link
              href="/dashboard"
              className="flex items-center justify-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-6 py-3 font-semibold text-slate-300 transition-all hover:bg-white/10 hover:text-white"
            >
              <Home size={18} /> Return to Dashboard
            </Link>
          </div>

          {process.env.NODE_ENV === "development" && this.state.error && (
            <div className="mt-12 w-full max-w-2xl overflow-hidden rounded-2xl border border-white/5 bg-slate-900/50 text-left">
              <div className="bg-slate-900 border-b border-white/5 px-4 py-2 text-xs font-mono text-slate-500 uppercase tracking-widest">
                Stack Trace (Dev Only)
              </div>
              <pre className="p-4 text-xs font-mono text-rose-300/80 overflow-x-auto">
                {this.state.error.stack}
              </pre>
            </div>
          )}
        </div>
      );
    }

    return this.props.children;
  }
}

