"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Building2, User, AlertCircle, Loader2 } from 'lucide-react';

export default function RegisterOrganizationPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [form, setForm] = useState({
    organizationName: '', contactEmail: '', contactPhone: '', address: '',
    adminName: '', adminEmail: '', adminPassword: '',
  });

  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm(f => ({ ...f, [k]: e.target.value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true); setError('');
    try {
      const res = await fetch('/api/auth/register-organization', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Registration failed');
      router.push('/?message=Organization+registered!+Please+log+in.');
    } catch (err: unknown) { setError(err instanceof Error ? err.message : 'Registration failed'); }
    finally { setLoading(false); }
  };

  const inputCls = "w-full bg-slate-950/50 border border-white/5 rounded-xl px-4 py-3 text-slate-200 outline-none focus:border-indigo-500/50 text-sm placeholder:text-slate-600 transition-colors";
  const labelCls = "block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2";

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-2xl animate-fade-in-up">
        <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-slate-900/50 p-6 shadow-2xl backdrop-blur-xl sm:p-8 md:p-10">
          <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-indigo-500/50 to-transparent" />

          <div className="text-center mb-10">
            <h1 className="text-3xl font-bold bg-gradient-to-br from-white to-slate-400 bg-clip-text text-transparent mb-2">
              Get Started
            </h1>
            <p className="text-slate-400 text-sm">Register your organization and create an admin account</p>
          </div>

          {error && (
            <div className="flex items-center gap-2 p-4 mb-6 bg-rose-500/10 border border-rose-500/20 rounded-xl text-rose-400 text-sm">
              <AlertCircle size={16} /> {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-8">
            {/* Organization Details */}
            <div>
              <div className="flex items-center gap-2 mb-4">
                <Building2 size={18} className="text-indigo-400" />
                <h2 className="text-lg font-semibold text-slate-200">Organization Details</h2>
              </div>
              <div className="space-y-4">
                <div>
                  <label className={labelCls}>Organization Name *</label>
                  <input value={form.organizationName} onChange={set('organizationName')} required
                    placeholder="Acme Corp" className={inputCls} />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className={labelCls}>Contact Email *</label>
                    <input type="email" value={form.contactEmail} onChange={set('contactEmail')} required
                      placeholder="hello@acme.com" className={inputCls} />
                  </div>
                  <div>
                    <label className={labelCls}>Phone Number</label>
                    <input value={form.contactPhone} onChange={set('contactPhone')}
                      placeholder="+91 9999999999" className={inputCls} />
                  </div>
                </div>
                <div>
                  <label className={labelCls}>Address</label>
                  <textarea value={form.address} onChange={set('address')} rows={2}
                    placeholder="123 Business Park, City" className={`${inputCls} resize-none`} />
                </div>
              </div>
            </div>

            <div className="border-t border-white/5" />

            {/* Admin Details */}
            <div>
              <div className="flex items-center gap-2 mb-4">
                <User size={18} className="text-indigo-400" />
                <h2 className="text-lg font-semibold text-slate-200">Admin Account</h2>
              </div>
              <div className="space-y-4">
                <div>
                  <label className={labelCls}>Full Name *</label>
                  <input value={form.adminName} onChange={set('adminName')} required
                    placeholder="John Doe" className={inputCls} />
                </div>
                <div>
                  <label className={labelCls}>Admin Email (Login) *</label>
                  <input type="email" value={form.adminEmail} onChange={set('adminEmail')} required
                    placeholder="admin@acme.com" className={inputCls} />
                </div>
                <div>
                  <label className={labelCls}>Password *</label>
                  <input type="password" value={form.adminPassword} onChange={set('adminPassword')} required
                    minLength={6} placeholder="Min. 6 characters" className={inputCls} />
                </div>
              </div>
            </div>

            <button type="submit" disabled={loading}
              className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-base shadow-lg shadow-indigo-600/20 transition-all active:scale-[0.98] disabled:opacity-70">
              {loading ? <Loader2 size={20} className="animate-spin" /> : 'Register Organization'}
            </button>
          </form>

          <div className="mt-6 text-center">
            <Link href="/" className="text-sm text-slate-400 hover:text-indigo-400 transition-colors">
              ← Return to Login
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
