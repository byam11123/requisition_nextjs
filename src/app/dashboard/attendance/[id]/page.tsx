"use client";

import Link from "next/link";
import { use, useEffect, useMemo, useState } from "react";
import { ArrowLeft, CheckCircle2, Loader2, XCircle } from "lucide-react";

import AttachmentCard from "@/app/dashboard/components/attachment-card";
import { DetailInfoRow } from "@/app/dashboard/components/detail-info";
import StatusTimeline, { type TimelineEvent } from "@/app/dashboard/status-timeline";
import StatusChip from "@/components/ui/status-chip";

import {
  DriverAttendanceRecord,
  formatAttendanceDate,
  getAttendanceStatusTone,
} from "../attendance-data";

function getStoredRole() {
  if (typeof window === "undefined") return "";

  const rawUser = localStorage.getItem("user");
  if (!rawUser) return "";

  try {
    const parsed = JSON.parse(rawUser) as { role?: string };
    return String(parsed.role || "").toUpperCase().trim();
  } catch {
    return "";
  }
}

export default function AttendanceDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const [record, setRecord] = useState<DriverAttendanceRecord | null>(null);
  const [userRole] = useState(() => getStoredRole());
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<"APPROVED" | "REJECTED" | null>(null);
  const [toast, setToast] = useState<{ type: "success" | "error"; message: string } | null>(null);

  useEffect(() => {
    const loadRecord = async () => {
      setLoading(true);
      try {
        const token = localStorage.getItem("token");
        const response = await fetch(`/api/attendance/${id}`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (!response.ok) {
          throw new Error("Failed to fetch attendance detail");
        }

        setRecord((await response.json()) as DriverAttendanceRecord);
      } catch (error) {
        console.error(error);
        setRecord(null);
      } finally {
        setLoading(false);
      }
    };

    void loadRecord();
  }, [id]);

  useEffect(() => {
    if (!toast) return;
    const timer = window.setTimeout(() => setToast(null), 2500);
    return () => window.clearTimeout(timer);
  }, [toast]);

  const handleApproval = async (status: "APPROVED" | "REJECTED") => {
    setActionLoading(status);
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`/api/attendance/${id}/approve`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ status }),
      });

      if (!response.ok) {
        const payload = (await response.json()) as { error?: string };
        throw new Error(payload.error || "Attendance approval failed");
      }

      const updated = (await response.json()) as Pick<
        DriverAttendanceRecord,
        "status" | "approvedAt" | "approvedByName"
      >;
      setRecord((current) =>
        current
          ? {
              ...current,
              status: updated.status,
              approvedAt: updated.approvedAt || null,
              approvedByName: updated.approvedByName || null,
            }
          : current,
      );
      setToast({
        type: "success",
        message: status === "APPROVED" ? "Attendance approved." : "Attendance rejected.",
      });
    } catch (error) {
      setToast({
        type: "error",
        message: error instanceof Error ? error.message : "Attendance approval failed",
      });
    } finally {
      setActionLoading(null);
    }
  };

  const timelineEvents = useMemo<TimelineEvent[]>(() => {
    if (!record) {
      return [];
    }

    const approvalState =
      record.status === "APPROVED"
        ? "done"
        : record.status === "REJECTED"
          ? "blocked"
          : "current";

    return [
      {
        key: "created",
        title: "Attendance Created",
        description: `${record.driverName} route slip was submitted from ${record.fromSiteName} to ${record.toSiteName}.`,
        timestamp: record.timestamp,
        state: "done",
      },
      {
        key: "evidence",
        title: record.geoTagPhotoUrl ? "Geo Tag Uploaded" : "Geo Tag Pending",
        description: record.geoTagPhotoUrl
          ? "Route evidence photo is attached to this attendance entry."
          : "No geo-tag photo has been attached to this attendance entry yet.",
        timestamp: record.geoTagPhotoUrl ? record.timestamp : null,
        state: record.geoTagPhotoUrl ? "done" : "pending",
      },
      {
        key: "approval",
        title:
          record.status === "APPROVED"
            ? "Attendance Approved"
            : record.status === "REJECTED"
              ? "Attendance Rejected"
              : "Awaiting Approval",
        description:
          record.status === "APPROVED"
            ? `Approved by ${record.approvedByName || "the reviewing admin"}.`
            : record.status === "REJECTED"
              ? `Rejected by ${record.approvedByName || "the reviewing admin"}.`
              : "This movement slip is still waiting for review and closure.",
        timestamp: record.approvedAt || null,
        state: approvalState,
      },
    ];
  }, [record]);

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
        Attendance record not found
      </p>
    );
  }

  const canReview = userRole === "MANAGER" && record.status === "PENDING";

  return (
    <div className="mx-auto max-w-6xl space-y-6 animate-fade-in-up">
      {toast && (
        <div
          className={`fixed right-5 top-5 z-50 rounded-xl border px-4 py-2.5 text-sm shadow-lg ${
            toast.type === "success"
              ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-300"
              : "border-rose-500/30 bg-rose-500/10 text-rose-300"
          }`}
        >
          {toast.message}
        </div>
      )}
      <Link
        href="/dashboard/attendance"
        className="inline-flex items-center gap-2 text-sm text-indigo-400 transition-colors hover:text-indigo-300"
      >
        <ArrowLeft size={16} /> Back to Attendance
      </Link>

      <div className="flex flex-col gap-6 lg:flex-row">
        <div className="min-w-0 flex-1 space-y-6">
          <div className="rounded-3xl border border-white/5 bg-slate-900/50 p-8">
            <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <p className="mb-1 text-xs uppercase tracking-wider text-slate-500">
                  Slip ID
                </p>
                <h1 className="text-2xl font-bold text-slate-100">{record.requestId}</h1>
                <p className="mt-1 text-sm text-slate-400">
                  Entry Timestamp: {formatAttendanceDate(record.timestamp)}
                </p>
              </div>
              <StatusChip tone={getAttendanceStatusTone(record.status)} size="sm">
                {record.status}
              </StatusChip>
            </div>

            <div className="space-y-6">
              <DetailInfoRow label="Admin Name" value={record.adminName} />
              <DetailInfoRow label="Driver Name" value={record.driverName} />
              <DetailInfoRow label="From Site" value={record.fromSiteName} />
              <DetailInfoRow label="To Site" value={record.toSiteName} />
              <DetailInfoRow label="Father's Name" value={record.fatherName} />
              <DetailInfoRow label="Vehicle Type" value={record.vehicleType} />
              <DetailInfoRow label="Vehicle Name" value={record.vehicleName} />
              <DetailInfoRow label="Vehicle No." value={record.vehicleNumber} />
              <DetailInfoRow
                label="Geo Tag Photo"
                value={
                  <div className="w-[210px]">
                    <AttachmentCard
                      title="Geo Tag Photo"
                      url={record.geoTagPhotoUrl}
                      emptyLabel="Not uploaded"
                      previewClassName="h-40"
                      imageClassName="object-cover"
                    />
                  </div>
                }
              />
              <DetailInfoRow label="Approved By" value={record.approvedByName || "-"} />
              <DetailInfoRow
                label="Approved At"
                value={record.approvedAt ? formatAttendanceDate(record.approvedAt) : "-"}
              />
            </div>
          </div>
        </div>

        <div className="w-full shrink-0 space-y-6 lg:w-80">
          <div className="rounded-3xl border border-white/5 bg-slate-900/50 p-6">
            <h3 className="mb-4 text-base font-semibold text-slate-100">Actions</h3>
            {canReview ? (
              <div className="space-y-3">
                <button
                  onClick={() => handleApproval("APPROVED")}
                  disabled={actionLoading !== null}
                  className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-emerald-500 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <CheckCircle2 size={16} />
                  {actionLoading === "APPROVED" ? "Approving..." : "Approve Attendance"}
                </button>
                <button
                  onClick={() => handleApproval("REJECTED")}
                  disabled={actionLoading !== null}
                  className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-rose-600 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-rose-500 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <XCircle size={16} />
                  {actionLoading === "REJECTED" ? "Rejecting..." : "Reject Attendance"}
                </button>
              </div>
            ) : (
              <p className="text-sm text-slate-400">
                {record.status === "PENDING"
                  ? "Only managers can approve or reject attendance."
                  : "Attendance review has already been completed."}
              </p>
            )}
          </div>

          <StatusTimeline events={timelineEvents} />
        </div>
      </div>
    </div>
  );
}
