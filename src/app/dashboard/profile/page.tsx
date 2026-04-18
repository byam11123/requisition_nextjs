"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { User, Mail, Briefcase, Building2, Camera, Key, Edit, X, Loader2, AlertCircle, CheckCircle } from 'lucide-react';

export default function ProfilePage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [org, setOrg] = useState<any>(null);
  const [passwordOpen, setPasswordOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [orgEditOpen, setOrgEditOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');

  const [editForm, setEditForm] = useState({ fullName: '', designation: '', department: '' });
  const [orgForm, setOrgForm] = useState({ name: '', requisitionPrefix: '', contactEmail: '', contactPhone: '', address: '' });
  const [pwForm, setPwForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });

  useEffect(() => {
    const u = localStorage.getItem('user');
    if (!u) { router.push('/'); return; }
    const parsed = JSON.parse(u);
    setUser(parsed);
    setEditForm({ fullName: parsed.fullName || '', designation: parsed.designation || '', department: parsed.department || '' });
    if (parsed.role === 'ADMIN') loadOrg();
  }, []);

  const loadOrg = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('/api/organization', { headers: { Authorization: `Bearer ${token}` } });
      if (res.ok) {
        const data = await res.json();
        setOrg(data);
        setOrgForm({ name: data.name || '', requisitionPrefix: data.requisitionPrefix || '', contactEmail: data.contactEmail || '', contactPhone: data.contactPhone || '', address: data.address || '' });
      }
    } catch { }
  };

  const handleEditProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true); setError(''); setSuccess('');
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`/api/users/${user.id}`, {
        method: 'PUT', headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify(editForm),
      });
      if (!res.ok) throw new Error('Update failed');
      const updatedUser = { ...user, ...editForm };
      localStorage.setItem('user', JSON.stringify(updatedUser));
      setUser(updatedUser);
      setSuccess('Profile updated successfully!');
      setEditOpen(false);
    } catch (err: any) { setError(err.message); }
    finally { setLoading(false); }
  };

  const handleUpdateOrg = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true); setError(''); setSuccess('');
    try {
      const token = localStorage.getItem('token');
      await fetch('/api/organization', {
        method: 'PUT', headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify(orgForm),
      });
      setSuccess('Organization updated!');
      setOrgEditOpen(false);
      loadOrg();
    } catch { setError('Update failed'); }
    finally { setLoading(false); }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (pwForm.newPassword !== pwForm.confirmPassword) { setError('Passwords do not match'); return; }
    setLoading(true); setError(''); setSuccess('');
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('/api/users/change-password', {
        method: 'POST', headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ currentPassword: pwForm.currentPassword, newPassword: pwForm.newPassword }),
      });
      if (!res.ok) throw new Error((await res.json()).error || 'Failed');
      setSuccess('Password changed successfully!');
      setPasswordOpen(false);
      setPwForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (err: any) { setError(err.message); }
    finally { setLoading(false); }
  };

  if (!user) return <div className="flex items-center justify-center h-64"><Loader2 className="animate-spin text-indigo-500" size={32} /></div>;

  const inputCls = "w-full bg-slate-950/50 border border-white/5 rounded-xl px-4 py-3 text-slate-200 outline-none focus:border-indigo-500/50 text-sm placeholder:text-slate-600";
  const labelCls = "block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2";
  const isAdmin = user.role === 'ADMIN';

  const InfoRow = ({ icon: Icon, label, value }: any) => (
    <div className="flex items-start gap-3">
      <div className="mt-0.5 p-2 rounded-xl bg-slate-800 border border-white/5"><Icon size={16} className="text-slate-400" /></div>
      <div>
        <p className="text-xs text-slate-500 mb-0.5">{label}</p>
        <p className="text-slate-200 font-medium">{value || '—'}</p>
      </div>
    </div>
  );

  const Modal = ({ open, onClose, title, onSubmit, children }: any) => {
    if (!open) return null;
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
        <div className="bg-slate-900 border border-white/10 rounded-3xl p-8 w-full max-w-md shadow-2xl animate-fade-in-up max-h-[90vh] overflow-y-auto">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-semibold text-slate-100">{title}</h2>
            <button onClick={onClose} className="p-2 rounded-xl hover:bg-white/5 text-slate-400"><X size={20} /></button>
          </div>
          <form onSubmit={onSubmit} className="space-y-4">
            {children}
            <div className="flex gap-3 pt-2">
              <button type="button" onClick={onClose} className="flex-1 py-2.5 rounded-xl border border-white/10 text-slate-400 hover:bg-white/5">Cancel</button>
              <button type="submit" disabled={loading} className="flex-1 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-medium">
                {loading ? <Loader2 size={16} className="animate-spin mx-auto" /> : 'Save'}
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6 animate-fade-in-up">
      <h1 className="text-2xl font-bold text-slate-100">My Profile</h1>

      {success && (
        <div className="flex items-center gap-2 p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-emerald-400 text-sm">
          <CheckCircle size={16} /> {success}
        </div>
      )}
      {error && (
        <div className="flex items-center gap-2 p-4 bg-rose-500/10 border border-rose-500/20 rounded-xl text-rose-400 text-sm">
          <AlertCircle size={16} /> {error}
        </div>
      )}

      {/* Personal Info Card */}
      <div className="bg-slate-900/50 border border-white/5 rounded-3xl p-8">
        <div className="flex flex-col sm:flex-row sm:items-center gap-6 mb-8">
          <div className="relative">
            <div className="w-20 h-20 rounded-2xl bg-slate-800 border border-white/10 flex items-center justify-center text-3xl font-bold text-indigo-400">
              {user.fullName?.[0]?.toUpperCase()}
            </div>
            <label className="absolute -bottom-2 -right-2 p-1.5 rounded-xl bg-slate-700 border border-white/10 cursor-pointer hover:bg-slate-600">
              <Camera size={14} className="text-slate-300" />
              <input type="file" className="hidden" accept="image/*" />
            </label>
          </div>
          <div className="flex-1">
            <div className="flex flex-wrap items-center gap-3 mb-1">
              <h2 className="text-xl font-semibold text-slate-100">{user.fullName}</h2>
              <span className={`px-2.5 py-0.5 text-xs font-medium rounded-full border
                ${isAdmin ? 'bg-purple-500/10 text-purple-400 border-purple-500/20' :
                  user.role === 'MANAGER' ? 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20' :
                  user.role === 'ACCOUNTANT' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' :
                  'bg-sky-500/10 text-sky-400 border-sky-500/20'}`}>
                {user.role}
              </span>
            </div>
            <p className="text-slate-400 text-sm">{user.email}</p>
          </div>
          <div className="flex flex-wrap gap-2">
            {isAdmin && (
              <button id="btn-edit-profile" onClick={() => setEditOpen(true)}
                className="flex items-center gap-2 px-3 py-2 rounded-xl border border-white/10 text-slate-300 hover:bg-white/5 text-sm">
                <Edit size={14} /> Edit Profile
              </button>
            )}
            <button id="btn-change-password" onClick={() => setPasswordOpen(true)}
              className="flex items-center gap-2 px-3 py-2 rounded-xl border border-white/10 text-slate-300 hover:bg-white/5 text-sm">
              <Key size={14} /> Change Password
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          <InfoRow icon={User} label="Full Name" value={user.fullName} />
          <InfoRow icon={Mail} label="Email Address" value={user.email} />
          <InfoRow icon={Briefcase} label="Role" value={user.role} />
          <InfoRow icon={Building2} label="Department" value={user.department} />
          <InfoRow icon={Briefcase} label="Designation" value={user.designation} />
          <InfoRow icon={Building2} label="Organization" value={user.organizationName} />
        </div>

        {!isAdmin && (
          <div className="mt-6 p-4 bg-slate-800/50 rounded-xl border border-white/5 text-sm text-slate-400">
            <strong className="text-slate-300">Note:</strong> To update your profile info, contact your organization admin.
          </div>
        )}
      </div>

      {/* Organization Settings (Admin Only) */}
      {isAdmin && org && (
        <div className="bg-slate-900/50 border border-white/5 rounded-3xl p-8">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-semibold text-slate-100">Organization Settings</h2>
            <button id="btn-edit-org" onClick={() => setOrgEditOpen(true)}
              className="flex items-center gap-2 px-3 py-2 rounded-xl border border-white/10 text-slate-300 hover:bg-white/5 text-sm">
              <Edit size={14} /> Edit
            </button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <InfoRow icon={Building2} label="Organization Name" value={org.name} />
            <InfoRow icon={Key} label="Requisition Prefix" value={org.requisitionPrefix} />
            <InfoRow icon={Mail} label="Contact Email" value={org.contactEmail} />
            <InfoRow icon={User} label="Contact Phone" value={org.contactPhone} />
            <InfoRow icon={Building2} label="Address" value={org.address} />
          </div>
        </div>
      )}

      {/* Edit Profile Modal */}
      <Modal open={editOpen} onClose={() => setEditOpen(false)} title="Edit Profile" onSubmit={handleEditProfile}>
        <div><label className={labelCls}>Full Name</label><input value={editForm.fullName} onChange={e => setEditForm(f => ({...f, fullName: e.target.value}))} required className={inputCls} /></div>
        <div><label className={labelCls}>Designation</label><input value={editForm.designation} onChange={e => setEditForm(f => ({...f, designation: e.target.value}))} className={inputCls} /></div>
        <div><label className={labelCls}>Department</label><input value={editForm.department} onChange={e => setEditForm(f => ({...f, department: e.target.value}))} className={inputCls} /></div>
      </Modal>

      {/* Edit Org Modal */}
      <Modal open={orgEditOpen} onClose={() => setOrgEditOpen(false)} title="Edit Organization" onSubmit={handleUpdateOrg}>
        <div><label className={labelCls}>Organization Name</label><input value={orgForm.name} onChange={e => setOrgForm(f => ({...f, name: e.target.value}))} required className={inputCls} /></div>
        <div><label className={labelCls}>Requisition Prefix</label><input value={orgForm.requisitionPrefix} onChange={e => setOrgForm(f => ({...f, requisitionPrefix: e.target.value.toUpperCase()}))} maxLength={5} className={inputCls} /></div>
        <div><label className={labelCls}>Contact Email</label><input type="email" value={orgForm.contactEmail} onChange={e => setOrgForm(f => ({...f, contactEmail: e.target.value}))} className={inputCls} /></div>
        <div><label className={labelCls}>Phone</label><input value={orgForm.contactPhone} onChange={e => setOrgForm(f => ({...f, contactPhone: e.target.value}))} className={inputCls} /></div>
        <div><label className={labelCls}>Address</label><textarea value={orgForm.address} onChange={e => setOrgForm(f => ({...f, address: e.target.value}))} rows={3} className={`${inputCls} resize-none`} /></div>
      </Modal>

      {/* Change Password Modal */}
      <Modal open={passwordOpen} onClose={() => setPasswordOpen(false)} title="Change Password" onSubmit={handleChangePassword}>
        {error && <div className="p-3 bg-rose-500/10 border border-rose-500/20 rounded-xl text-rose-400 text-sm">{error}</div>}
        <div><label className={labelCls}>Current Password</label><input type="password" value={pwForm.currentPassword} onChange={e => setPwForm(f => ({...f, currentPassword: e.target.value}))} required className={inputCls} /></div>
        <div><label className={labelCls}>New Password</label><input type="password" value={pwForm.newPassword} onChange={e => setPwForm(f => ({...f, newPassword: e.target.value}))} required minLength={8} className={inputCls} /></div>
        <div><label className={labelCls}>Confirm New Password</label><input type="password" value={pwForm.confirmPassword} onChange={e => setPwForm(f => ({...f, confirmPassword: e.target.value}))} required className={inputCls} /></div>
      </Modal>
    </div>
  );
}
