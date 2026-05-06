"use client";
import { useAuthStore } from '@/modules/auth/hooks/use-auth-store';
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import {
  AlertCircle,
  ArrowLeft,
  Loader2,
  Send,
  Upload,
  X,
} from "lucide-react";

type AttendanceFormState = {
  adminName: string;
  driverName: string;
  fromSiteName: string;
  toSiteName: string;
  fatherName: string;
  vehicleType: string;
  vehicleName: string;
  vehicleNumber: string;
};

function getStoredAdminName() {
  if (typeof window === "undefined") {
    return "";
  }

  const rawUser = window.JSON.stringify(useAuthStore.getState().user);
  if (!rawUser) {
    return "";
  }

  try {
    const parsed = JSON.parse(rawUser);
    return typeof parsed?.fullName === "string" ? parsed.fullName : "";
  } catch {
    return "";
  }
}

export default function CreateAttendancePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [geoTagPhoto, setGeoTagPhoto] = useState<File | null>(null);
  const [geoTagPreview, setGeoTagPreview] = useState<string | null>(null);
  const [timestampPreview] = useState(() =>
    new Date().toLocaleString("en-IN", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    }),
  );
  const [form, setForm] = useState<AttendanceFormState>({
    adminName: getStoredAdminName(),
    driverName: "",
    fromSiteName: "",
    toSiteName: "",
    fatherName: "",
    vehicleType: "",
    vehicleName: "",
    vehicleNumber: "",
  });
  const [users, setUsers] = useState<any[]>([]);
  const [approverId, setApproverId] = useState("");

  useEffect(() => {
    const loadDefaults = async () => {
      try {
        const token = useAuthStore.getState().token;
        const [usersRes, defaultsRes] = await Promise.all([
          fetch("/api/users", { headers: { Authorization: `Bearer ${token}` } }),
          fetch("/api/workflow-defaults?module=DRIVER_ATTENDANCE", { headers: { Authorization: `Bearer ${token}` } })
        ]);
        if (usersRes.ok) setUsers(await usersRes.json());
        if (defaultsRes.ok) {
          const defaults = await defaultsRes.json();
          if (defaults?.defaultApproverId) setApproverId(defaults.defaultApproverId);
        }
      } catch (err) {
        console.error("Failed to load defaults", err);
      }
    };
    loadDefaults();
  }, []);

  const inputCls =
    "w-full rounded-xl border border-white/5 bg-slate-950/50 px-4 py-3 text-sm text-slate-200 outline-none transition-colors placeholder:text-slate-600 focus:border-indigo-500/50";
  const disabledCls = `${inputCls} cursor-not-allowed opacity-70`;
  const labelCls =
    "mb-2 block text-xs font-semibold uppercase tracking-wider text-slate-400";

  const setField =
    (key: keyof AttendanceFormState) =>
    (event: React.ChangeEvent<HTMLInputElement>) => {
      setForm((current) => ({ ...current, [key]: event.target.value }));
    };

  const uploadGeoTagPhoto = async (file: File, requisitionId: string) => {
    const token = useAuthStore.getState().token;
    const formData = new FormData();
    formData.append("file", file);
    formData.append("requisitionId", requisitionId);
    formData.append("category", "ATTENDANCE_GEOTAG");

    const response = await fetch("/api/uploads", {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
      body: formData,
    });

    if (!response.ok) {
      const payload = await response.json().catch(() => ({}));
      throw new Error(payload.error || "Geo tag photo upload failed");
    }
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");

    if (!form.adminName.trim()) {
      setError("Admin name is required.");
      return;
    }
    if (!form.driverName.trim()) {
      setError("Driver name is required.");
      return;
    }
    if (!form.fromSiteName.trim()) {
      setError("From site name is required.");
      return;
    }
    if (!form.toSiteName.trim()) {
      setError("To site name is required.");
      return;
    }
    if (!form.vehicleType.trim()) {
      setError("Vehicle type is required.");
      return;
    }
    if (!form.vehicleName.trim()) {
      setError("Vehicle name is required.");
      return;
    }
    if (!form.vehicleNumber.trim()) {
      setError("Vehicle number is required.");
      return;
    }
    if (!geoTagPhoto) {
      setError("Geo tag photo is required.");
      return;
    }

    setLoading(true);
    try {
      const token = useAuthStore.getState().token;
      const response = await fetch("/api/attendance", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          adminName: form.adminName.trim(),
          driverName: form.driverName.trim(),
          fromSiteName: form.fromSiteName.trim(),
          toSiteName: form.toSiteName.trim(),
          fatherName: form.fatherName.trim() || "NA",
          vehicleType: form.vehicleType.trim(),
          vehicleName: form.vehicleName.trim(),
          vehicleNumber: form.vehicleNumber.trim().toUpperCase(),
          approverId: approverId || null,
        }),
      });

      if (!response.ok) {
        const payload = await response.json().catch(() => ({}));
        throw new Error(payload.error || "Failed to create attendance slip");
      }

      const created = await response.json();
      await uploadGeoTagPhoto(geoTagPhoto, String(created.id));
      router.push("/dashboard/attendance");
    } catch (submitError: unknown) {
      const message =
        submitError instanceof Error
          ? submitError.message
          : "Unable to create attendance slip.";
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-4xl space-y-6 animate-fade-in-up">
      <Link
        href="/dashboard/attendance"
        className="inline-flex items-center gap-2 text-sm text-indigo-400 transition-colors hover:text-indigo-300"
      >
        <ArrowLeft size={16} /> Back to Attendance
      </Link>

      <div className="rounded-3xl border border-white/5 bg-slate-900/50 p-5 sm:p-6 lg:p-8">
        <h1 className="mb-1 text-2xl font-bold text-slate-100">
          New Driver Attendance
        </h1>
        <p className="mb-6 text-sm text-slate-400">
          Fill the movement slip details exactly as required and upload the geo-tag
          photo before submitting.
        </p>

        {error && (
          <div className="mb-6 flex items-center gap-2 rounded-xl border border-rose-500/20 bg-rose-500/10 p-4 text-sm text-rose-400">
            <AlertCircle size={16} /> {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className={labelCls}>Admin Name *</label>
              <input
                value={form.adminName}
                onChange={setField("adminName")}
                placeholder="Admin full name"
                className={inputCls}
                required
              />
            </div>
            <div>
              <label className={labelCls}>Driver Name *</label>
              <input
                value={form.driverName}
                onChange={setField("driverName")}
                placeholder="Driver full name"
                className={inputCls}
                required
              />
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className={labelCls}>From (Site Name) *</label>
              <input
                value={form.fromSiteName}
                onChange={setField("fromSiteName")}
                placeholder="Origin site"
                className={inputCls}
                required
              />
            </div>
            <div>
              <label className={labelCls}>To (Site Name) *</label>
              <input
                value={form.toSiteName}
                onChange={setField("toSiteName")}
                placeholder="Destination site"
                className={inputCls}
                required
              />
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className={labelCls}>Father&apos;s Name</label>
              <input
                value={form.fatherName}
                onChange={setField("fatherName")}
                placeholder="NA if not available"
                className={inputCls}
              />
            </div>
            <div>
              <label className={labelCls}>Vehicle Type *</label>
              <input
                value={form.vehicleType}
                onChange={setField("vehicleType")}
                placeholder="HMV / LMV"
                className={inputCls}
                required
              />
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className={labelCls}>Vehicle Name *</label>
              <input
                value={form.vehicleName}
                onChange={setField("vehicleName")}
                placeholder="Vehicle name"
                className={inputCls}
                required
              />
            </div>
            <div>
              <label className={labelCls}>Vehicle No. *</label>
              <input
                value={form.vehicleNumber}
                onChange={setField("vehicleNumber")}
                placeholder="CG04XY4567"
                className={inputCls}
                required
              />
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-1 border-t border-white/5 pt-6">
            <div>
              <p className="mb-4 text-xs font-semibold uppercase tracking-wider text-indigo-400">
                Workflow Assignment
              </p>
              <div className="p-4 rounded-2xl bg-slate-950/50 border border-white/5">
                <label className={labelCls}>Assigned Approver *</label>
                <select
                  value={approverId}
                  onChange={(e) => setApproverId(e.target.value)}
                  className={inputCls}
                  required
                >
                  <option value="">Select Approver</option>
                  {users.map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.fullName} ({u.role})
                    </option>
                  ))}
                </select>
                <p className="mt-2 text-[10px] text-slate-500">
                  This person will receive the request for approval.
                </p>
              </div>
            </div>
          </div>

          <div className="border-t border-white/5 pt-6">
            <p className="mb-4 text-xs font-semibold uppercase tracking-wider text-indigo-400">
              Geo Tag Photo
            </p>
            <div className="rounded-2xl border border-dashed border-white/10 p-4">
              {geoTagPreview ? (
                <div className="relative">
                  <Image
                    src={geoTagPreview}
                    alt="Geo tag preview"
                    width={1200}
                    height={720}
                    className="h-60 w-full rounded-xl object-contain"
                    unoptimized
                  />
                  <button
                    type="button"
                    onClick={() => {
                      setGeoTagPhoto(null);
                      setGeoTagPreview(null);
                    }}
                    className="absolute right-2 top-2 rounded-full bg-slate-800 p-1.5 text-slate-300 transition-colors hover:text-rose-400"
                  >
                    <X size={14} />
                  </button>
                </div>
              ) : (
                <div className="py-8 text-center">
                  <p className="mb-2 text-sm text-slate-400">
                    Upload the attendance geo-tag image
                  </p>
                  <label className="inline-flex cursor-pointer items-center gap-2 rounded-xl border border-white/10 px-4 py-2 text-sm text-slate-300 transition-colors hover:bg-white/5">
                    <Upload size={14} /> Choose File
                    <input
                      type="file"
                      className="hidden"
                      accept="image/*"
                      onChange={(event) => {
                        const file = event.target.files?.[0] || null;
                        setGeoTagPhoto(file);
                        setGeoTagPreview(file ? URL.createObjectURL(file) : null);
                      }}
                    />
                  </label>
                </div>
              )}
            </div>
            {geoTagPhoto && (
              <p className="mt-3 text-xs text-slate-500">
                Selected file: {geoTagPhoto.name}
              </p>
            )}
          </div>

          <div className="flex justify-end gap-3 border-t border-white/5 pt-4">
            <button
              type="submit"
              disabled={loading}
              className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-6 py-2.5 text-sm font-medium text-white shadow-lg shadow-indigo-600/20 transition-colors hover:bg-indigo-500 disabled:opacity-50"
            >
              {loading ? (
                <Loader2 size={16} className="animate-spin" />
              ) : (
                <Send size={16} />
              )}
              Submit Attendance
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
