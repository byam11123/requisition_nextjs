"use client";

import Image from "next/image";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { AlertCircle, ArrowLeft, Loader2, Send, Upload, X } from "lucide-react";

import { calculateTotalRunning } from "../vehicle-fuel-data";
import FormSelect, {
  type FormSelectOption,
} from "@/components/ui/form-select";

export default function CreateVehicleFuelPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState({
    requestedByName: "",
    fuelType: "DIESEL",
    vehicleType: "",
    rcNo: "",
    lastPurchaseDate: "",
    lastIssuedQtyLitres: "0",
    lastReading: "0",
    currentReading: "0",
    currentRequirementLitres: "0",
  });
  const [lastReadingPhoto, setLastReadingPhoto] = useState<File | null>(null);
  const [lastReadingPreview, setLastReadingPreview] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    const rawUser = localStorage.getItem("user");
    if (!rawUser) {
      return () => {
        cancelled = true;
      };
    }

    try {
      const parsed = JSON.parse(rawUser);
      if (parsed?.fullName) {
        const timer = window.setTimeout(() => {
          if (!cancelled) {
            setForm((current) => ({
              ...current,
              requestedByName: parsed.fullName,
            }));
          }
        }, 0);

        return () => {
          cancelled = true;
          window.clearTimeout(timer);
        };
      }
    } catch {
      // ignore malformed local storage
    }

    return () => {
      cancelled = true;
    };
  }, []);

  const totalRunning = useMemo(
    () =>
      calculateTotalRunning(
        Number(form.lastReading || 0),
        Number(form.currentReading || 0),
      ),
    [form.currentReading, form.lastReading],
  );

  const setField =
    (key: keyof typeof form) =>
    (
      event: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>,
    ) =>
      setForm((current) => ({ ...current, [key]: event.target.value }));

  const uploadFile = async (file: File, requisitionId: string) => {
    const token = localStorage.getItem("token");
    const formData = new FormData();
    formData.append("file", file);
    formData.append("requisitionId", requisitionId);
    formData.append("category", "MATERIAL");

    const response = await fetch("/api/uploads", {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
      body: formData,
    });

    if (!response.ok) {
      const payload = await response.json().catch(() => ({}));
      throw new Error(payload.error || "Last reading photo upload failed");
    }
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError("");

    if (!form.vehicleType.trim()) {
      setError("Vehicle type is required");
      return;
    }
    if (!form.rcNo.trim()) {
      setError("RC number is required");
      return;
    }
    if (!form.lastPurchaseDate) {
      setError("Last purchase date is required");
      return;
    }
    if (Number(form.currentReading || 0) < Number(form.lastReading || 0)) {
      setError("Current reading cannot be lower than last reading");
      return;
    }
    if (Number(form.currentRequirementLitres || 0) <= 0) {
      setError("Current fuel requirement should be greater than zero");
      return;
    }

    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      const createResponse = await fetch("/api/vehicle-fuel", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...form,
          totalRunning,
        }),
      });

      if (!createResponse.ok) {
        const payload = await createResponse.json().catch(() => ({}));
        throw new Error(payload.error || "Failed to create vehicle fuel request");
      }

      const created = await createResponse.json();
      const requestId = String(created.id);

      if (lastReadingPhoto) {
        await uploadFile(lastReadingPhoto, requestId);
      }

      router.push(`/dashboard/vehicle-fuel/${requestId}`);
    } catch (submitError: unknown) {
      setError(
        submitError instanceof Error
          ? submitError.message
          : "Something went wrong",
      );
    } finally {
      setLoading(false);
    }
  };

  const inputCls =
    "w-full rounded-xl border border-white/5 bg-slate-950/50 px-4 py-3 text-sm text-slate-200 outline-none transition-colors placeholder:text-slate-600 focus:border-indigo-500/50";
  const labelCls =
    "mb-2 block text-xs font-semibold uppercase tracking-wider text-slate-400";
  const fuelTypeOptions: FormSelectOption<string>[] = [
    { value: "DIESEL", label: "Diesel" },
    { value: "PETROL", label: "Petrol" },
  ];

  return (
    <div className="mx-auto max-w-4xl space-y-6 animate-fade-in-up">
      <Link
        href="/dashboard/vehicle-fuel"
        className="inline-flex items-center gap-2 text-sm text-indigo-400 transition-colors hover:text-indigo-300"
      >
        <ArrowLeft size={16} /> Back to Vehicle Daily Fuel
      </Link>

      <div className="rounded-3xl border border-white/5 bg-slate-900/50 p-5 sm:p-6 lg:p-8">
        <h1 className="mb-1 text-2xl font-bold text-slate-100">
          New Vehicle Fuel Request
        </h1>
        <p className="mb-6 text-sm text-slate-400">
          Submit the reading slip first. Approval and fuel bill upload happen from the detail page after the request is created.
        </p>

        {error ? (
          <div className="mb-6 flex items-center gap-2 rounded-xl border border-rose-500/20 bg-rose-500/10 p-4 text-sm text-rose-400">
            <AlertCircle size={16} />
            {error}
          </div>
        ) : null}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div>
              <label className={labelCls}>Request ID</label>
              <input
                value="Auto Generated on Submit"
                disabled
                className={`${inputCls} cursor-not-allowed opacity-70`}
              />
            </div>
            <div>
              <label className={labelCls}>Timestamp</label>
              <input
                value="Auto Generated on Submit"
                disabled
                className={`${inputCls} cursor-not-allowed opacity-70`}
              />
            </div>
            <div>
              <label className={labelCls}>Requested By</label>
              <input
                value={form.requestedByName}
                onChange={setField("requestedByName")}
                placeholder="Employee / requester name"
                className={inputCls}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className={labelCls}>Fuel Type</label>
              <FormSelect
                value={form.fuelType}
                options={fuelTypeOptions}
                onChange={(value) =>
                  setForm((current) => ({ ...current, fuelType: value }))
                }
              />
            </div>
            <div>
              <label className={labelCls}>Vehicle Type *</label>
              <input
                value={form.vehicleType}
                onChange={setField("vehicleType")}
                placeholder="Scooty / Car / Generator"
                className={inputCls}
                required
              />
            </div>
            <div>
              <label className={labelCls}>RC No. *</label>
              <input
                value={form.rcNo}
                onChange={setField("rcNo")}
                placeholder="CG13 AA 9712"
                className={inputCls}
                required
              />
            </div>
            <div>
              <label className={labelCls}>Last Purchase Date *</label>
              <input
                type="date"
                value={form.lastPurchaseDate}
                onChange={setField("lastPurchaseDate")}
                className={inputCls}
                required
              />
            </div>
            <div>
              <label className={labelCls}>Last Issued Qty. (Ltrs.)</label>
              <input
                type="number"
                min="0"
                step="0.1"
                value={form.lastIssuedQtyLitres}
                onChange={setField("lastIssuedQtyLitres")}
                className={inputCls}
              />
            </div>
            <div>
              <label className={labelCls}>Current Requirement (Ltrs.) *</label>
              <input
                type="number"
                min="0"
                step="0.1"
                value={form.currentRequirementLitres}
                onChange={setField("currentRequirementLitres")}
                className={inputCls}
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div>
              <label className={labelCls}>Last Reading (KM/Hrs.)</label>
              <input
                type="number"
                min="0"
                value={form.lastReading}
                onChange={setField("lastReading")}
                className={inputCls}
              />
            </div>
            <div>
              <label className={labelCls}>Current Reading (KM/Hrs.)</label>
              <input
                type="number"
                min="0"
                value={form.currentReading}
                onChange={setField("currentReading")}
                className={inputCls}
              />
            </div>
            <div>
              <label className={labelCls}>Total Running (KM/Hrs.)</label>
              <input
                value={String(totalRunning)}
                disabled
                className={`${inputCls} cursor-not-allowed opacity-70`}
              />
            </div>
          </div>

          <div className="border-t border-white/5 pt-6">
            <p className="mb-4 text-xs font-semibold uppercase tracking-wider text-indigo-400">
              Reading Slip
            </p>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-[minmax(0,1fr)_240px]">
              <div className="rounded-2xl border border-dashed border-white/10 p-4">
                {lastReadingPreview ? (
                  <div className="relative">
                    <Image
                      src={lastReadingPreview}
                      alt="Last reading preview"
                      width={720}
                      height={360}
                      className="h-48 w-full rounded-xl object-cover"
                      unoptimized
                    />
                    <button
                      type="button"
                      onClick={() => {
                        setLastReadingPhoto(null);
                        setLastReadingPreview(null);
                      }}
                      className="absolute right-2 top-2 rounded-full bg-slate-900/80 p-1 text-slate-300 transition-colors hover:text-rose-400"
                    >
                      <X size={14} />
                    </button>
                  </div>
                ) : (
                  <div className="flex h-48 flex-col items-center justify-center text-center">
                    <p className="mb-2 text-sm text-slate-500">
                      Upload the last reading photo or meter slip
                    </p>
                    <label className="inline-flex cursor-pointer items-center gap-2 rounded-xl border border-white/10 px-4 py-2 text-sm text-slate-300 transition-colors hover:bg-white/5">
                      <Upload size={14} />
                      Choose File
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(event) => {
                          const file = event.target.files?.[0] || null;
                          setLastReadingPhoto(file);
                          setLastReadingPreview(
                            file ? URL.createObjectURL(file) : null,
                          );
                        }}
                      />
                    </label>
                  </div>
                )}
              </div>

              <div className="rounded-2xl border border-white/5 bg-slate-950/30 p-4">
                <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-slate-500">
                  Slip Preview
                </p>
                <div className="space-y-3 text-sm">
                  <div className="flex items-center justify-between gap-4">
                    <span className="text-slate-500">Fuel Type</span>
                    <span className="text-slate-100">{form.fuelType}</span>
                  </div>
                  <div className="flex items-center justify-between gap-4">
                    <span className="text-slate-500">Vehicle</span>
                    <span className="text-right text-slate-100">
                      {form.vehicleType || "-"}
                    </span>
                  </div>
                  <div className="flex items-center justify-between gap-4">
                    <span className="text-slate-500">RC No.</span>
                    <span className="text-right text-slate-100">
                      {form.rcNo || "-"}
                    </span>
                  </div>
                  <div className="flex items-center justify-between gap-4">
                    <span className="text-slate-500">Total Running</span>
                    <span className="text-slate-100">{totalRunning} KM/Hrs</span>
                  </div>
                  <div className="flex items-center justify-between gap-4">
                    <span className="text-slate-500">Requirement</span>
                    <span className="text-slate-100">
                      {form.currentRequirementLitres || 0} Ltr
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-3 border-t border-white/5 pt-4">
            <button
              type="submit"
              disabled={loading}
              className="flex items-center gap-2 rounded-xl bg-indigo-600 px-6 py-2.5 text-sm font-medium text-white shadow-lg shadow-indigo-600/20 transition-colors hover:bg-indigo-500 disabled:opacity-50"
            >
              {loading ? (
                <Loader2 size={16} className="animate-spin" />
              ) : (
                <Send size={16} />
              )}
              Submit Fuel Request
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
