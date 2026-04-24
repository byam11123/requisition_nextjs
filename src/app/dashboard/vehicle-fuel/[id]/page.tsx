"use client";

import Image from "next/image";
import Link from "next/link";
import { use, useEffect, useMemo, useState } from "react";
import {
  ArrowLeft,
  CheckCircle2,
  Loader2,
  ReceiptText,
  Upload,
  X,
  XCircle,
} from "lucide-react";

import ActionToast from "@/app/dashboard/action-toast";
import AttachmentCard from "@/app/dashboard/components/attachment-card";
import { DetailInfoRow } from "@/app/dashboard/components/detail-info";
import StatusChip from "@/components/ui/status-chip";
import StatusTimeline, { type TimelineEvent } from "@/app/dashboard/status-timeline";
import {
  formatFuelCurrency,
  formatFuelDistance,
  formatFuelQuantity,
  formatVehicleFuelDate,
  formatVehicleFuelShortDate,
  getVehicleFuelStatusTone,
  VehicleFuelRecord,
} from "../vehicle-fuel-data";

export default function VehicleFuelDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const [record, setRecord] = useState<VehicleFuelRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [savingApproval, setSavingApproval] = useState(false);
  const [savingBill, setSavingBill] = useState(false);
  const [billPhoto, setBillPhoto] = useState<File | null>(null);
  const [billPreview, setBillPreview] = useState<string | null>(null);
  const [billAmount, setBillAmount] = useState("0");
  const [fuelPumpName, setFuelPumpName] = useState("");
  const [toast, setToast] = useState<{
    message: string;
    tone: "success" | "error";
  } | null>(null);
  const [userRole, setUserRole] = useState<string | null>(null);

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
      const timer = window.setTimeout(() => {
        if (!cancelled) {
          setUserRole(parsed?.role || null);
        }
      }, 0);

      return () => {
        cancelled = true;
        window.clearTimeout(timer);
      };
    } catch {
      const timer = window.setTimeout(() => {
        if (!cancelled) {
          setUserRole(null);
        }
      }, 0);

      return () => {
        cancelled = true;
        window.clearTimeout(timer);
      };
    }
  }, []);

  useEffect(() => {
    const fetchRecord = async () => {
      setLoading(true);
      try {
        const token = localStorage.getItem("token");
        const response = await fetch(`/api/vehicle-fuel/${id}`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (!response.ok) {
          throw new Error("Failed to fetch vehicle fuel detail");
        }

        const payload = (await response.json()) as VehicleFuelRecord;
        setRecord(payload);
        setBillAmount(String(payload.billAmount || 0));
        setFuelPumpName(payload.fuelPumpName || "");
      } catch (error) {
        console.error(error);
        setRecord(null);
      } finally {
        setLoading(false);
      }
    };

    fetchRecord();
  }, [id]);

  const canApprove = useMemo(
    () =>
      !!record &&
      record.approvalStatus === "PENDING" &&
      (userRole === "ADMIN" || userRole === "MANAGER"),
    [record, userRole],
  );

  const canUploadBill = useMemo(
    () =>
      !!record &&
      record.approvalStatus === "APPROVED" &&
      !record.billPhotoUrl,
    [record],
  );

  const timelineEvents = useMemo<TimelineEvent[]>(() => {
    if (!record) {
      return [];
    }

    return [
      {
        key: "created",
        title: "Fuel Request Created",
        description: `${record.vehicleType} request was created for ${formatFuelQuantity(record.currentRequirementLitres)}.`,
        timestamp: record.entryTimestamp,
        state: "done",
      },
      {
        key: "approval",
        title:
          record.approvalStatus === "APPROVED"
            ? "Fuel Request Approved"
            : record.approvalStatus === "REJECTED"
              ? "Fuel Request Rejected"
              : "Awaiting Approval",
        description:
          record.approvalStatus === "APPROVED"
            ? `Approved by ${record.approvedByName || "the reviewing team"}.`
            : record.approvalStatus === "REJECTED"
              ? `Rejected by ${record.approvedByName || "the reviewing team"}.`
              : "The request is waiting for approval before bill upload can happen.",
        timestamp: record.approvedAt || null,
        state:
          record.approvalStatus === "APPROVED"
            ? "done"
            : record.approvalStatus === "REJECTED"
              ? "blocked"
              : "current",
      },
      {
        key: "bill",
        title: record.billPhotoUrl ? "Fuel Bill Uploaded" : "Bill Pending",
        description: record.billPhotoUrl
          ? "Final fuel bill has been uploaded and the request is closed."
          : "Upload the final bill after approval to complete this request.",
        timestamp: record.billUploadedAt || null,
        state: record.billPhotoUrl ? "done" : record.approvalStatus === "APPROVED" ? "current" : "pending",
      },
    ];
  }, [record]);

  const uploadBill = async () => {
    if (!billPhoto) {
      throw new Error("Select the fuel bill before saving");
    }

    const token = localStorage.getItem("token");
    const formData = new FormData();
    formData.append("file", billPhoto);
    formData.append("requisitionId", String(id));
    formData.append("category", "BILL");

    const response = await fetch("/api/uploads", {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
      body: formData,
    });

    if (!response.ok) {
      const payload = await response.json().catch(() => ({}));
      throw new Error(payload.error || "Fuel bill upload failed");
    }
  };

  const handleApproval = async (approvalStatus: "APPROVED" | "REJECTED") => {
    setSavingApproval(true);
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`/api/vehicle-fuel/${id}/approve`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ approvalStatus }),
      });

      const payload = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(payload.error || "Approval update failed");
      }

      setRecord(payload as VehicleFuelRecord);
      setToast({
        message:
          approvalStatus === "APPROVED"
            ? "Fuel request approved"
            : "Fuel request rejected",
        tone: "success",
      });
    } catch (error: unknown) {
      setToast({
        message:
          error instanceof Error ? error.message : "Approval update failed",
        tone: "error",
      });
    } finally {
      setSavingApproval(false);
    }
  };

  const handleBillSave = async () => {
    setSavingBill(true);
    try {
      await uploadBill();

      const token = localStorage.getItem("token");
      const response = await fetch(`/api/vehicle-fuel/${id}`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          fuelPumpName,
          billAmount: Number(billAmount || 0),
        }),
      });

      const payload = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(payload.error || "Failed to save bill details");
      }

      const nextRecord = payload as VehicleFuelRecord;
      setRecord(nextRecord);
      setBillPhoto(null);
      setBillPreview(null);
      setToast({
        message: "Fuel bill saved successfully",
        tone: "success",
      });
    } catch (error: unknown) {
      setToast({
        message: error instanceof Error ? error.message : "Bill save failed",
        tone: "error",
      });
    } finally {
      setSavingBill(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="animate-spin text-indigo-500" size={32} />
      </div>
    );
  }

  if (!record) {
    return (
      <p className="py-12 text-center text-slate-400">
        Vehicle fuel request not found
      </p>
    );
  }

  return (
    <div className="mx-auto max-w-6xl space-y-6 animate-fade-in-up">
      {toast ? (
        <ActionToast
          message={toast.message}
          tone={toast.tone}
          onClose={() => setToast(null)}
        />
      ) : null}

      <Link
        href="/dashboard/vehicle-fuel"
        className="inline-flex items-center gap-2 text-sm text-indigo-400 transition-colors hover:text-indigo-300"
      >
        <ArrowLeft size={16} /> Back to Vehicle Daily Fuel
      </Link>

      <div className="flex flex-col gap-6 lg:flex-row">
        <div className="min-w-0 flex-1 space-y-6">
          <div className="rounded-3xl border border-white/5 bg-slate-900/50 p-8">
            <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <p className="mb-1 text-xs uppercase tracking-wider text-slate-500">
                  Request ID
                </p>
                <h1 className="text-2xl font-bold text-slate-100">
                  {record.requestId}
                </h1>
                <p className="mt-1 text-sm text-slate-400">
                  Entry Timestamp: {formatVehicleFuelDate(record.entryTimestamp)}
                </p>
              </div>
              <StatusChip tone={getVehicleFuelStatusTone(record.status)} size="sm">
                {record.status}
              </StatusChip>
            </div>

            <div className="space-y-6">
              <DetailInfoRow label="Requested By" value={record.requestedByName} />
              <DetailInfoRow label="Fuel Type" value={record.fuelType} />
              <DetailInfoRow label="Vehicle Type" value={record.vehicleType} />
              <DetailInfoRow label="RC No." value={record.rcNo} />
              <DetailInfoRow
                label="Last Purchase Date"
                value={formatVehicleFuelShortDate(record.lastPurchaseDate)}
              />
              <DetailInfoRow
                label="Last Issued Qty."
                value={formatFuelQuantity(record.lastIssuedQtyLitres)}
              />
              <DetailInfoRow
                label="Last Reading"
                value={formatFuelDistance(record.lastReading)}
              />
              <DetailInfoRow
                label="Current Reading"
                value={formatFuelDistance(record.currentReading)}
              />
              <DetailInfoRow
                label="Total Running"
                value={formatFuelDistance(record.totalRunning)}
              />
              <DetailInfoRow
                label="Current Requirement"
                value={formatFuelQuantity(record.currentRequirementLitres)}
              />
              <DetailInfoRow
                label="Last Reading Photo"
                value={
                  <div className="w-[210px]">
                    <AttachmentCard
                      title="Last Reading Photo"
                      url={record.lastReadingPhotoUrl}
                      emptyLabel="Not uploaded"
                      previewClassName="h-40"
                      imageClassName="object-cover"
                    />
                  </div>
                }
              />
              <DetailInfoRow
                label="Approved By"
                value={record.approvedByName || "-"}
              />
              <DetailInfoRow
                label="Approved At"
                value={formatVehicleFuelDate(record.approvedAt)}
              />
            </div>
          </div>

          {record.approvalStatus === "APPROVED" ? (
            <div className="rounded-3xl border border-white/5 bg-slate-900/50 p-8">
              <div className="mb-4 flex items-start gap-3">
                <div className="rounded-xl bg-indigo-500/10 p-2 text-indigo-400">
                  <ReceiptText size={18} />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-slate-100">
                    Fuel Bill Upload
                  </h2>
                  <p className="mt-1 text-sm text-slate-400">
                    Upload the final petrol or diesel bill after approval to close the request.
                  </p>
                </div>
              </div>

              {record.billPhotoUrl ? (
                <div className="mb-5 rounded-2xl border border-emerald-500/20 bg-emerald-500/10 p-4 text-sm text-emerald-300">
                  Fuel bill uploaded on {formatVehicleFuelDate(record.billUploadedAt)}.
                </div>
              ) : null}

              {canUploadBill ? (
                <div className="grid grid-cols-1 gap-4 lg:grid-cols-[minmax(0,1fr)_280px]">
                  <div className="space-y-4">
                    <div>
                      <label className="mb-2 block text-xs font-semibold uppercase tracking-wider text-slate-400">
                        Fuel Pump Name
                      </label>
                      <input
                        value={fuelPumpName}
                        onChange={(event) => setFuelPumpName(event.target.value)}
                        className="w-full rounded-xl border border-white/5 bg-slate-950/50 px-4 py-3 text-sm text-slate-200 outline-none transition-colors focus:border-indigo-500/50"
                        placeholder="Pump / vendor name"
                      />
                    </div>
                    <div>
                      <label className="mb-2 block text-xs font-semibold uppercase tracking-wider text-slate-400">
                        Bill Amount
                      </label>
                      <input
                        type="number"
                        min="0"
                        value={billAmount}
                        onChange={(event) => setBillAmount(event.target.value)}
                        className="w-full rounded-xl border border-white/5 bg-slate-950/50 px-4 py-3 text-sm text-slate-200 outline-none transition-colors focus:border-indigo-500/50"
                      />
                    </div>
                    <div className="rounded-2xl border border-dashed border-white/10 p-4">
                      {billPreview ? (
                        <div className="relative">
                          <Image
                            src={billPreview}
                            alt="Fuel bill preview"
                            width={720}
                            height={420}
                            className="h-56 w-full rounded-xl object-cover"
                            unoptimized
                          />
                          <button
                            type="button"
                            onClick={() => {
                              setBillPhoto(null);
                              setBillPreview(null);
                            }}
                            className="absolute right-2 top-2 rounded-full bg-slate-900/80 p-1 text-slate-300 transition-colors hover:text-rose-400"
                          >
                            <X size={14} />
                          </button>
                        </div>
                      ) : (
                        <div className="flex h-56 flex-col items-center justify-center text-center">
                          <p className="mb-2 text-sm text-slate-500">
                            Upload the final fuel bill
                          </p>
                          <label className="inline-flex cursor-pointer items-center gap-2 rounded-xl border border-white/10 px-4 py-2 text-sm text-slate-300 transition-colors hover:bg-white/5">
                            <Upload size={14} />
                            Choose Bill
                            <input
                              type="file"
                              accept="image/*"
                              className="hidden"
                              onChange={(event) => {
                                const file = event.target.files?.[0] || null;
                                setBillPhoto(file);
                                setBillPreview(
                                  file ? URL.createObjectURL(file) : null,
                                );
                              }}
                            />
                          </label>
                        </div>
                      )}
                    </div>
                    <div className="flex justify-end">
                      <button
                        type="button"
                        onClick={handleBillSave}
                        disabled={savingBill}
                        className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-indigo-500 disabled:opacity-50"
                      >
                        {savingBill ? (
                          <Loader2 size={16} className="animate-spin" />
                        ) : (
                          <Upload size={16} />
                        )}
                        Save Bill
                      </button>
                    </div>
                  </div>

                  <div className="rounded-2xl border border-white/5 bg-slate-950/30 p-4">
                    <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-slate-500">
                      Bill Checklist
                    </p>
                    <div className="space-y-3 text-sm text-slate-300">
                      <p>1. Approve the request first.</p>
                      <p>2. Upload the diesel or petrol bill.</p>
                      <p>3. Save the bill amount and pump name.</p>
                      <p>4. Request auto-moves to completed after bill save.</p>
                    </div>
                  </div>
                </div>
              ) : null}
            </div>
          ) : null}

          {record.approvalStatus === "REJECTED" ? (
            <div className="rounded-3xl border border-rose-500/20 bg-rose-500/10 p-4 text-sm text-rose-300">
              This request was rejected and cannot move to the bill stage.
            </div>
          ) : null}

          <div className="rounded-3xl border border-white/5 bg-slate-900/50 p-8">
            <h3 className="mb-4 text-lg font-semibold text-slate-100">Bill Summary</h3>
            <div className="space-y-6">
              <DetailInfoRow label="Fuel Pump Name" value={record.fuelPumpName || "-"} />
              <DetailInfoRow
                label="Bill Amount"
                value={
                  record.billAmount > 0
                    ? formatFuelCurrency(record.billAmount)
                    : "-"
                }
              />
              <DetailInfoRow
                label="Bill Upload"
                value={
                  <div className="w-[210px]">
                    <AttachmentCard
                      title="Bill Upload"
                      url={record.billPhotoUrl}
                      emptyLabel="Pending upload"
                      previewClassName="h-40"
                      imageClassName="object-cover"
                    />
                  </div>
                }
              />
            </div>
          </div>
        </div>

        <div className="w-full shrink-0 space-y-6 lg:w-80">
          <div className="rounded-3xl border border-white/5 bg-slate-900/50 p-6">
            <h3 className="mb-4 text-base font-semibold text-slate-100">Actions</h3>
            <div className="space-y-3">
              {canApprove ? (
                <div className="flex gap-2">
                  <button
                    onClick={() => handleApproval("REJECTED")}
                    disabled={savingApproval}
                    className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl border border-rose-500/20 bg-rose-500/10 px-4 py-2 text-sm font-medium text-rose-300 transition-colors hover:bg-rose-500/20 disabled:opacity-50"
                  >
                    <XCircle size={16} />
                    Reject
                  </button>
                  <button
                    onClick={() => handleApproval("APPROVED")}
                    disabled={savingApproval}
                    className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-indigo-500 disabled:opacity-50"
                  >
                    {savingApproval ? (
                      <Loader2 size={16} className="animate-spin" />
                    ) : (
                      <CheckCircle2 size={16} />
                    )}
                    Approve
                  </button>
                </div>
              ) : (
                <p className="text-sm text-slate-500">
                  No pending action for your role right now.
                </p>
              )}
            </div>
          </div>

          <StatusTimeline events={timelineEvents} />
        </div>
      </div>
    </div>
  );
}
