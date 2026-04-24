"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  AlertCircle,
  ArrowRight,
  Building2,
  LogIn,
  Lock,
  Mail,
  User,
} from "lucide-react";

type AuthMode = "login" | "signup";

export default function LoginPage() {
  const router = useRouter();
  const [mode, setMode] = useState<AuthMode>("login");
  const [organizationName, setOrganizationName] = useState("");
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [contactPhone, setContactPhone] = useState("");
  const [address, setAddress] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const endpoint = mode === "login" ? "/api/login" : "/api/signup";
      const payload =
        mode === "login"
          ? { email, password }
          : {
              organizationName,
              fullName,
              email,
              password,
              contactPhone,
              address,
            };

      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Authentication failed");
      }

      window.localStorage.setItem("token", data.token);
      window.localStorage.setItem("user", JSON.stringify(data.user));
      router.push("/dashboard/overview");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
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
              onClick={() => {
                setMode("login");
                setError("");
              }}
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
              onClick={() => {
                setMode("signup");
                setError("");
              }}
              className={`rounded-xl px-4 py-2.5 text-sm font-medium transition-colors ${
                mode === "signup"
                  ? "bg-[var(--app-accent)] text-white"
                  : "text-[var(--app-muted)] hover:bg-[var(--app-accent-soft)] hover:text-[var(--app-text)]"
              }`}
            >
              Sign Up
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {error && (
              <div className="flex items-center gap-2 rounded-xl border border-rose-500/20 bg-rose-500/10 p-4 text-sm text-rose-400">
                <AlertCircle size={18} />
                <p>{error}</p>
              </div>
            )}

            {mode === "signup" && (
              <>
                <div className="space-y-1">
                  <label className="ml-1 text-xs font-semibold uppercase tracking-wider text-[var(--app-muted)]">
                    Organization Name
                  </label>
                  <div className="relative group">
                    <div className="absolute inset-y-0 left-0 flex items-center pl-4 text-[var(--app-muted)] transition-colors group-focus-within:text-[var(--app-accent)]">
                      <Building2 size={18} />
                    </div>
                    <input
                      type="text"
                      value={organizationName}
                      onChange={(e) => setOrganizationName(e.target.value)}
                      className="w-full rounded-xl border border-[var(--app-border)] bg-[var(--app-panel)] py-3.5 pl-12 pr-4 text-sm shadow-inner outline-none transition-all placeholder:text-[var(--app-muted)]/40 focus:border-[var(--app-accent-border)] focus:bg-[var(--app-surface-strong)]"
                      placeholder="Your organization name"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="ml-1 text-xs font-semibold uppercase tracking-wider text-[var(--app-muted)]">
                    Admin Name
                  </label>
                  <div className="relative group">
                    <div className="absolute inset-y-0 left-0 flex items-center pl-4 text-[var(--app-muted)] transition-colors group-focus-within:text-[var(--app-accent)]">
                      <User size={18} />
                    </div>
                    <input
                      type="text"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      className="w-full rounded-xl border border-[var(--app-border)] bg-[var(--app-panel)] py-3.5 pl-12 pr-4 text-sm shadow-inner outline-none transition-all placeholder:text-[var(--app-muted)]/40 focus:border-[var(--app-accent-border)] focus:bg-[var(--app-surface-strong)]"
                      placeholder="Administrator full name"
                      required
                    />
                  </div>
                </div>
              </>
            )}

            <div className="space-y-1">
              <label className="ml-1 text-xs font-semibold uppercase tracking-wider text-[var(--app-muted)]">
                Email
              </label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 flex items-center pl-4 text-[var(--app-muted)] transition-colors group-focus-within:text-[var(--app-accent)]">
                  <Mail size={18} />
                </div>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full rounded-xl border border-[var(--app-border)] bg-[var(--app-panel)] py-3.5 pl-12 pr-4 text-sm shadow-inner outline-none transition-all placeholder:text-[var(--app-muted)]/40 focus:border-[var(--app-accent-border)] focus:bg-[var(--app-surface-strong)]"
                  placeholder="name@example.com"
                  required
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="ml-1 text-xs font-semibold uppercase tracking-wider text-[var(--app-muted)]">
                Password
              </label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 flex items-center pl-4 text-[var(--app-muted)] transition-colors group-focus-within:text-[var(--app-accent)]">
                  <Lock size={18} />
                </div>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full rounded-xl border border-[var(--app-border)] bg-[var(--app-panel)] py-3.5 pl-12 pr-4 text-sm shadow-inner outline-none transition-all placeholder:text-[var(--app-muted)]/40 focus:border-[var(--app-accent-border)] focus:bg-[var(--app-surface-strong)]"
                  placeholder="At least 8 characters"
                  required
                />
              </div>
            </div>

            {mode === "signup" && (
              <>
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-1">
                    <label className="ml-1 text-xs font-semibold uppercase tracking-wider text-[var(--app-muted)]">
                      Contact Phone
                    </label>
                    <input
                      type="text"
                      value={contactPhone}
                      onChange={(e) => setContactPhone(e.target.value)}
                      className="w-full rounded-xl border border-[var(--app-border)] bg-[var(--app-panel)] px-4 py-3.5 text-sm shadow-inner outline-none transition-all placeholder:text-[var(--app-muted)]/40 focus:border-[var(--app-accent-border)] focus:bg-[var(--app-surface-strong)]"
                      placeholder="Optional"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="ml-1 text-xs font-semibold uppercase tracking-wider text-[var(--app-muted)]">
                      Address
                    </label>
                    <input
                      type="text"
                      value={address}
                      onChange={(e) => setAddress(e.target.value)}
                      className="w-full rounded-xl border border-[var(--app-border)] bg-[var(--app-panel)] px-4 py-3.5 text-sm shadow-inner outline-none transition-all placeholder:text-[var(--app-muted)]/40 focus:border-[var(--app-accent-border)] focus:bg-[var(--app-surface-strong)]"
                      placeholder="Optional"
                    />
                  </div>
                </div>
                <p className="rounded-2xl border border-[var(--app-border)] bg-[var(--app-panel)]/30 px-4 py-3 text-xs text-[var(--app-muted)]">
                  The first registered user becomes the organization admin and can manage users, permissions, and page access.
                </p>
              </>
            )}

            <button
              type="submit"
              disabled={loading}
              className="mt-2 flex w-full items-center justify-center gap-2 rounded-xl bg-[var(--app-accent)] px-4 py-3.5 font-medium text-white shadow-lg shadow-[var(--app-accent)]/20 transition-all active:scale-[0.98] hover:bg-[var(--app-accent-hover)] disabled:opacity-70 disabled:active:scale-100"
            >
              {loading ? (
                <div className="h-5 w-5 animate-spin rounded-full border-2 border-white/30 border-t-white" />
              ) : (
                <>
                  {mode === "login" ? "Sign In" : "Create Organization"}
                  {mode === "login" ? (
                    <LogIn size={18} className="transition-transform group-hover:translate-x-1" />
                  ) : (
                    <ArrowRight size={18} className="transition-transform group-hover:translate-x-1" />
                  )}
                </>
              )}
            </button>
          </form>
        </div>

        <div className="pointer-events-none absolute -bottom-10 left-1/2 h-24 w-3/4 -translate-x-1/2 bg-indigo-500/20 blur-[100px]" />
      </div>
    </div>
  );
}
