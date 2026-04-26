"use client";

import { useState } from "react";
import { LoginForm } from "@/modules/auth/components/login-form";
import { SignUpForm } from "@/modules/auth/components/signup-form";

type AuthMode = "login" | "signup";

export default function LoginPage() {
  const [mode, setMode] = useState<AuthMode>("login");

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-[var(--app-bg)]">
      <div className="w-full max-w-xl animate-fade-in-up">
        <div className="relative overflow-hidden rounded-3xl border border-[var(--app-border)] bg-[var(--app-surface-strong)] p-6 shadow-2xl backdrop-blur-xl sm:p-8">
          <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[var(--app-accent)] to-transparent" />

          <div className="mb-8 text-center">
            <h1 className="mb-2 text-3xl font-bold text-[var(--app-text)]">
              Requisition Hub
            </h1>
            <p className="text-sm text-[var(--app-muted)]">
              {mode === "login"
                ? "Sign in to manage your workflows"
                : "Create your organization and start as admin"}
            </p>
          </div>

          <div className="mb-6 grid grid-cols-2 gap-2 rounded-2xl border border-[var(--app-border)] bg-[var(--app-panel)] p-1">
            <button
              type="button"
              onClick={() => setMode("login")}
              className={`rounded-xl px-4 py-2.5 text-sm font-medium transition-colors ${
                mode === "login"
                  ? "bg-[var(--app-accent)] text-white"
                  : "text-[var(--app-muted)] hover:bg-[var(--app-accent-soft)] hover:text-[var(--app-text)]"
              }`}
            >
              Sign In
            </button>
            <button
              type="button"
              onClick={() => setMode("signup")}
              className={`rounded-xl px-4 py-2.5 text-sm font-medium transition-colors ${
                mode === "signup"
                  ? "bg-[var(--app-accent)] text-white"
                  : "text-[var(--app-muted)] hover:bg-[var(--app-accent-soft)] hover:text-[var(--app-text)]"
              }`}
            >
              Sign Up
            </button>
          </div>

          {mode === "login" ? <LoginForm /> : <SignUpForm />}
        </div>

        <div className="pointer-events-none absolute -bottom-10 left-1/2 h-24 w-3/4 -translate-x-1/2 bg-indigo-500/20 blur-[100px]" />
      </div>
    </div>
  );
}

