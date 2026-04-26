import { useState } from 'react';
import { LogIn, Mail, Lock, AlertCircle } from 'lucide-react';
import { useAuth } from '../hooks/use-auth';

export function LoginForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const { login, isLoading, error } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await login(email, password);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {error && (
        <div className="flex items-center gap-2 rounded-xl border border-rose-500/20 bg-rose-500/10 p-4 text-sm text-rose-400">
          <AlertCircle size={18} />
          <p>{error}</p>
        </div>
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
            placeholder="••••••••"
            required
          />
        </div>
      </div>

      <button
        type="submit"
        disabled={isLoading}
        className="mt-2 flex w-full items-center justify-center gap-2 rounded-xl bg-[var(--app-accent)] px-4 py-3.5 font-medium text-white shadow-lg shadow-[var(--app-accent)]/20 transition-all active:scale-[0.98] hover:bg-[var(--app-accent-hover)] disabled:opacity-70 disabled:active:scale-100"
      >
        {isLoading ? (
          <div className="h-5 w-5 animate-spin rounded-full border-2 border-white/30 border-t-white" />
        ) : (
          <>
            Sign In
            <LogIn size={18} className="transition-transform group-hover:translate-x-1" />
          </>
        )}
      </button>
    </form>
  );
}
