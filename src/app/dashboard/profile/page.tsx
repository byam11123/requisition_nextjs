"use client";
import { useAuthStore } from '@/modules/auth/hooks/use-auth-store';




import { startTransition, useEffect, useState, type FormEvent, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import {
  User,
  Mail,
  Briefcase,
  Building2,
  Camera,
  Key,
  Edit,
  X,
  Loader2,
  AlertCircle,
  CheckCircle,
  type LucideIcon,
} from "lucide-react";

type SessionUser = {
  id?: number | string;
  fullName?: string;
  email?: string;
  role?: string;
  department?: string;
  designation?: string;
  organizationName?: string; organization?: { name: string; };
};

type OrganizationProfile = {
  name?: string;
  requisitionPrefix?: string;
  contactEmail?: string;
  contactPhone?: string;
  address?: string;
};

type ProfileForm = {
  fullName: string;
  designation: string;
  department: string;
};

type OrganizationForm = {
  name: string;
  requisitionPrefix: string;
  contactEmail: string;
  contactPhone: string;
  address: string;
};

type PasswordForm = {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
};

type InfoRowProps = {
  icon: LucideIcon;
  label: string;
  value?: string;
};

type ProfileModalProps = {
  open: boolean;
  onClose: () => void;
  title: string;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void | Promise<void>;
  loading: boolean;
  children: ReactNode;
};

function getErrorMessage(error: unknown, fallback: string) {
  return error instanceof Error && error.message ? error.message : fallback;
}

function InfoRow({ icon: Icon, label, value }: InfoRowProps) {
  return (
    <div className="flex items-start gap-3">
      <div className="mt-0.5 rounded-xl border border-white/5 bg-slate-800 p-2">
        <Icon size={16} className="text-slate-400" />
      </div>
      <div>
        <p className="mb-0.5 text-xs text-slate-500">{label}</p>
        <p className="font-medium text-slate-200">{value || "-"}</p>
      </div>
    </div>
  );
}

function ProfileModal({ open, onClose, title, onSubmit, loading, children }: ProfileModalProps) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
      <div className="max-h-[90vh] w-full max-w-md overflow-y-auto rounded-3xl border border-white/10 bg-slate-900 p-5 shadow-2xl animate-fade-in-up sm:p-6 lg:p-8">
        <div className="mb-6 flex items-start justify-between gap-4">
          <h2 className="text-lg font-semibold text-slate-100 sm:text-xl">{title}</h2>
          <button onClick={onClose} className="rounded-xl p-2 text-slate-400 hover:bg-white/5">
            <X size={20} />
          </button>
        </div>
        <form onSubmit={onSubmit} className="space-y-4">
          {children}
          <div className="flex flex-col gap-3 pt-2 sm:flex-row">
            <button type="button" onClick={onClose} className="flex-1 rounded-xl border border-white/10 py-2.5 text-slate-400 hover:bg-white/5">
              Cancel
            </button>
            <button type="submit" disabled={loading} className="flex-1 rounded-xl bg-indigo-600 py-2.5 font-medium text-white hover:bg-indigo-500">
              {loading ? <Loader2 size={16} className="mx-auto animate-spin" /> : "Save"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function ProfilePage() {
  const router = useRouter();
  const [user, setUser] = useState<SessionUser | null>(null);
  const [org, setOrg] = useState<OrganizationProfile | null>(null);
  const [passwordOpen, setPasswordOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [orgEditOpen, setOrgEditOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");
  const [editForm, setEditForm] = useState<ProfileForm>({ fullName: "", designation: "", department: "" });
  const [orgForm, setOrgForm] = useState<OrganizationForm>({
    name: "",
    requisitionPrefix: "",
    contactEmail: "",
    contactPhone: "",
    address: "",
  });
  const [pwForm, setPwForm] = useState<PasswordForm>({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  const inputCls =
    "w-full rounded-xl border border-white/5 bg-slate-950/50 px-4 py-3 text-sm text-slate-200 outline-none placeholder:text-slate-600 focus:border-indigo-500/50";
  const labelCls = "mb-2 block text-xs font-semibold uppercase tracking-wider text-slate-400";

  const loadOrg = async () => {
    try {
      const token = useAuthStore.getState().token;
      const res = await fetch("/api/organization", { headers: { Authorization: `Bearer ${token}` } });
      if (!res.ok) return;
      const data = (await res.json()) as OrganizationProfile;
      setOrg(data);
      setOrgForm({
        name: data.name || "",
        requisitionPrefix: data.requisitionPrefix || "",
        contactEmail: data.contactEmail || "",
        contactPhone: data.contactPhone || "",
        address: data.address || "",
      });
    } catch {
      setError("Failed to load organization settings.");
    }
  };

  useEffect(() => {
    const rawUser = JSON.stringify(useAuthStore.getState().user);
    if (!rawUser) {
      router.push("/");
      return;
    }

    const parsed = JSON.parse(rawUser) as SessionUser;
    startTransition(() => {
      setUser(parsed);
      setEditForm({
        fullName: parsed.fullName || "",
        designation: parsed.designation || "",
        department: parsed.department || "",
      });
    });

    const run = async () => {
      await loadOrg();
    };
    void run();
  }, [router]);

  const handleEditProfile = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!user?.id) return;

    setLoading(true);
    setError("");
    setSuccess("");
    try {
      const token = useAuthStore.getState().token;
      const res = await fetch(`/api/users/${user.id}`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(editForm),
      });
      if (!res.ok) throw new Error("Update failed");

      const updatedUser: SessionUser = { ...user, ...editForm };
      localStorage.setItem("user", JSON.stringify(updatedUser));
      setUser(updatedUser);
      setSuccess("Profile updated successfully!");
      setEditOpen(false);
    } catch (error: unknown) {
      setError(getErrorMessage(error, "Update failed"));
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateOrg = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoading(true);
    setError("");
    setSuccess("");
    try {
      const token = useAuthStore.getState().token;
      const res = await fetch("/api/organization", {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(orgForm),
      });
      if (!res.ok) throw new Error("Update failed");
      setSuccess("Organization updated!");
      setOrgEditOpen(false);
      await loadOrg();
    } catch (error: unknown) {
      setError(getErrorMessage(error, "Update failed"));
    } finally {
      setLoading(false);
    }
  };

  const handleChangePassword = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (pwForm.newPassword !== pwForm.confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    setLoading(true);
    setError("");
    setSuccess("");
    try {
      const token = useAuthStore.getState().token;
      const res = await fetch("/api/users/change-password", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          currentPassword: pwForm.currentPassword,
          newPassword: pwForm.newPassword,
        }),
      });
      if (!res.ok) {
        const payload = (await res.json()) as { error?: string };
        throw new Error(payload.error || "Failed");
      }
      setSuccess("Password changed successfully!");
      setPasswordOpen(false);
      setPwForm({ currentPassword: "", newPassword: "", confirmPassword: "" });
    } catch (error: unknown) {
      setError(getErrorMessage(error, "Failed"));
    } finally {
      setLoading(false);
    }
  };

  if (!user) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="animate-spin text-indigo-500" size={32} />
      </div>
    );
  }

  const isAdmin = user.role === "ADMIN";

  return (
    <div className="mx-auto max-w-3xl space-y-6 animate-fade-in-up">
      <h1 className="text-xl font-bold text-slate-100 sm:text-2xl">My Profile</h1>

      {success && (
        <div className="flex items-center gap-2 rounded-xl border border-emerald-500/20 bg-emerald-500/10 p-4 text-sm text-emerald-400">
          <CheckCircle size={16} /> {success}
        </div>
      )}
      {error && (
        <div className="flex items-center gap-2 rounded-xl border border-rose-500/20 bg-rose-500/10 p-4 text-sm text-rose-400">
          <AlertCircle size={16} /> {error}
        </div>
      )}

      <div className="rounded-3xl border border-white/5 bg-slate-900/50 p-5 sm:p-6 lg:p-8">
        <div className="mb-8 flex flex-col gap-6 sm:flex-row sm:items-center">
          <div className="relative w-fit mx-auto sm:mx-0">
            <div className="flex h-20 w-20 items-center justify-center rounded-2xl border border-white/10 bg-slate-800 text-3xl font-bold text-indigo-400">
              {user.fullName?.[0]?.toUpperCase()}
            </div>
            <label className="absolute -bottom-2 -right-2 cursor-pointer rounded-xl border border-white/10 bg-slate-700 p-1.5 hover:bg-slate-600">
              <Camera size={14} className="text-slate-300" />
              <input type="file" className="hidden" accept="image/*" />
            </label>
          </div>

          <div className="flex-1 text-center sm:text-left">
            <div className="mb-1 flex flex-wrap items-center justify-center sm:justify-start gap-3">
              <h2 className="text-xl font-semibold text-slate-100">{user.fullName}</h2>
              <span
                className={`rounded-full border px-2.5 py-0.5 text-xs font-medium ${
                  isAdmin
                    ? "border-purple-500/20 bg-purple-500/10 text-purple-400"
                    : user.role === "MANAGER"
                      ? "border-indigo-500/20 bg-indigo-500/10 text-indigo-400"
                      : user.role === "ACCOUNTANT"
                        ? "border-emerald-500/20 bg-emerald-500/10 text-emerald-400"
                        : "border-sky-500/20 bg-sky-500/10 text-sky-400"
                }`}
              >
                {user.role}
              </span>
            </div>
            <p className="text-sm text-slate-400">{user.email}</p>
          </div>

          <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
            {isAdmin && (
              <button
                id="btn-edit-profile"
                onClick={() => setEditOpen(true)}
                className="flex items-center gap-2 rounded-xl border border-white/10 px-3 py-2 text-sm text-slate-300 hover:bg-white/5"
              >
                <Edit size={14} /> Edit Profile
              </button>
            )}
            <button
              id="btn-change-password"
              onClick={() => setPasswordOpen(true)}
              className="flex items-center gap-2 rounded-xl border border-white/10 px-3 py-2 text-sm text-slate-300 hover:bg-white/5"
            >
              <Key size={14} /> Change Password
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
          <InfoRow icon={User} label="Full Name" value={user.fullName} />
          <InfoRow icon={Mail} label="Email Address" value={user.email} />
          <InfoRow icon={Briefcase} label="Role" value={user.role} />
          <InfoRow icon={Building2} label="Department" value={user.department} />
          <InfoRow icon={Briefcase} label="Designation" value={user.designation} />
          <InfoRow icon={Building2} label="Organization" value={user.organization?.name || user.organizationName || org?.name} />
        </div>

        {!isAdmin && (
          <div className="mt-6 rounded-xl border border-white/5 bg-slate-800/50 p-4 text-sm text-slate-400">
            <strong className="text-slate-300">Note:</strong> To update your profile info, contact your organization admin.
          </div>
        )}
      </div>

      {isAdmin && org && (
        <div className="rounded-3xl border border-white/5 bg-slate-900/50 p-5 sm:p-6 lg:p-8">
          <div className="mb-6 flex items-start justify-between gap-4">
            <h2 className="text-lg font-semibold text-slate-100 sm:text-xl">Organization Settings</h2>
            <button
              id="btn-edit-org"
              onClick={() => setOrgEditOpen(true)}
              className="flex items-center gap-2 rounded-xl border border-white/10 px-3 py-2 text-sm text-slate-300 hover:bg-white/5"
            >
              <Edit size={14} /> Edit
            </button>
          </div>
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
            <InfoRow icon={Building2} label="Organization Name" value={org.name} />
            <InfoRow icon={Key} label="Requisition Prefix" value={org.requisitionPrefix} />
            <InfoRow icon={Mail} label="Contact Email" value={org.contactEmail} />
            <InfoRow icon={User} label="Contact Phone" value={org.contactPhone} />
            <InfoRow icon={Building2} label="Address" value={org.address} />
          </div>
        </div>
      )}

      <ProfileModal open={editOpen} onClose={() => setEditOpen(false)} title="Edit Profile" onSubmit={handleEditProfile} loading={loading}>
        <div>
          <label className={labelCls}>Full Name</label>
          <input value={editForm.fullName} onChange={(e) => setEditForm((form) => ({ ...form, fullName: e.target.value }))} required className={inputCls} />
        </div>
        <div>
          <label className={labelCls}>Designation</label>
          <input value={editForm.designation} onChange={(e) => setEditForm((form) => ({ ...form, designation: e.target.value }))} className={inputCls} />
        </div>
        <div>
          <label className={labelCls}>Department</label>
          <input value={editForm.department} onChange={(e) => setEditForm((form) => ({ ...form, department: e.target.value }))} className={inputCls} />
        </div>
      </ProfileModal>

      <ProfileModal open={orgEditOpen} onClose={() => setOrgEditOpen(false)} title="Edit Organization" onSubmit={handleUpdateOrg} loading={loading}>
        <div>
          <label className={labelCls}>Organization Name</label>
          <input value={orgForm.name} onChange={(e) => setOrgForm((form) => ({ ...form, name: e.target.value }))} required className={inputCls} />
        </div>
        <div>
          <label className={labelCls}>Requisition Prefix</label>
          <input
            value={orgForm.requisitionPrefix}
            onChange={(e) => setOrgForm((form) => ({ ...form, requisitionPrefix: e.target.value.toUpperCase() }))}
            maxLength={5}
            className={inputCls}
          />
        </div>
        <div>
          <label className={labelCls}>Contact Email</label>
          <input type="email" value={orgForm.contactEmail} onChange={(e) => setOrgForm((form) => ({ ...form, contactEmail: e.target.value }))} className={inputCls} />
        </div>
        <div>
          <label className={labelCls}>Phone</label>
          <input value={orgForm.contactPhone} onChange={(e) => setOrgForm((form) => ({ ...form, contactPhone: e.target.value }))} className={inputCls} />
        </div>
        <div>
          <label className={labelCls}>Address</label>
          <textarea
            value={orgForm.address}
            onChange={(e) => setOrgForm((form) => ({ ...form, address: e.target.value }))}
            rows={3}
            className={`${inputCls} resize-none`}
          />
        </div>
      </ProfileModal>

      <ProfileModal open={passwordOpen} onClose={() => setPasswordOpen(false)} title="Change Password" onSubmit={handleChangePassword} loading={loading}>
        {error && <div className="rounded-xl border border-rose-500/20 bg-rose-500/10 p-3 text-sm text-rose-400">{error}</div>}
        <div>
          <label className={labelCls}>Current Password</label>
          <input
            type="password"
            value={pwForm.currentPassword}
            onChange={(e) => setPwForm((form) => ({ ...form, currentPassword: e.target.value }))}
            required
            className={inputCls}
          />
        </div>
        <div>
          <label className={labelCls}>New Password</label>
          <input
            type="password"
            value={pwForm.newPassword}
            onChange={(e) => setPwForm((form) => ({ ...form, newPassword: e.target.value }))}
            required
            minLength={8}
            className={inputCls}
          />
        </div>
        <div>
          <label className={labelCls}>Confirm New Password</label>
          <input
            type="password"
            value={pwForm.confirmPassword}
            onChange={(e) => setPwForm((form) => ({ ...form, confirmPassword: e.target.value }))}
            required
            className={inputCls}
          />
        </div>
      </ProfileModal>
    </div>
  );
}







