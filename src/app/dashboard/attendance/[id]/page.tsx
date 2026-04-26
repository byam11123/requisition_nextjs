"use client";

import Link from "next/link";
import { use, useEffect, useMemo, useState } from "react";
import { ArrowLeft, CheckCircle2, Loader2, XCircle } from "lucide-react";
import AttachmentCard from "@/app/dashboard/components/attachment-card";
import { DetailInfoRow } from "@/app/dashboard/components/detail-info";
import StatusTimeline, { type TimelineEvent } from "@/modules/common/components/status-timeline";
import StatusChip from "@/components/ui/status-chip";
import { formatDate } from "@/utils/format";

export default function AttendanceDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [record, setRecord] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      try {
        const token = localStorage.getItem("token");
        const res = await fetch(`/api/attendance/${id}`, { headers: { Authorization: `Bearer ${token}` } });
        setRecord(await res.json());
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [id]);

  const handleAction = async (status: string) => {
    setActionLoading(status);
    try {
      const token = localStorage.getItem("token");
      await fetch(`/api/attendance/${id}/approve`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      setRecord((r:any) => ({ ...r, status }));
    } finally {
      setActionLoading(null);
    }
  };

  const timelineEvents = useMemo<TimelineEvent[]>(() => {
    if (!record) return [];
    return [
      { key: "created", title: "Attendance Created", description: `Submitted for driver ${record.driverName}.`, timestamp: record.timestamp, state: "done" },
      { key: "approval", title: record.status === 'PENDING' ? "Awaiting Approval" : record.status, description: `Movement slip status: ${record.status}`, timestamp: null, state: record.status === 'PENDING' ? 'current' : 'done' },
    ];
  }, [record]);

  if (loading) return <div className="flex h-64 items-center justify-center"><Loader2 className="animate-spin text-indigo-500" size={32} /></div>;
  if (!record) return <p className="py-12 text-center text-slate-400">Record not found</p>;

  return (
    <div className="mx-auto max-w-6xl space-y-6 animate-fade-in-up">
      <Link href="/dashboard/attendance" className="inline-flex items-center gap-2 text-sm text-indigo-400 hover:text-indigo-300 transition-colors">
        <ArrowLeft size={16} /> Back to Attendance
      </Link>

      <div className="flex flex-col gap-6 lg:flex-row">
        <div className="flex-1 space-y-6">
          <div className="rounded-3xl border border-white/5 bg-slate-900/50 p-8">
            <div className="flex justify-between items-start mb-6">
              <div>
                <p className="text-xs uppercase tracking-wider text-slate-500 mb-1">Slip ID</p>
                <h1 className="text-2xl font-bold">{record.requestId}</h1>
              </div>
              <StatusChip tone={record.status === 'APPROVED' ? 'emerald' : 'amber'}>{record.status}</StatusChip>
            </div>

            <div className="space-y-6">
              <DetailInfoRow label="Driver" value={record.driverName} />
              <DetailInfoRow label="From Site" value={record.fromSiteName} />
              <DetailInfoRow label="To Site" value={record.toSiteName} />
              <DetailInfoRow label="Vehicle" value={`${record.vehicleName} (${record.vehicleNumber})`} />
              <DetailInfoRow label="Geo Tag" value={<div className="w-48"><AttachmentCard title="Evidence" url={record.geoTagPhotoUrl} /></div>} />
            </div>
          </div>
        </div>

        <div className="w-full lg:w-80 space-y-6">
          <div className="rounded-3xl border border-white/5 bg-slate-900/50 p-6">
            <h3 className="font-semibold mb-4">Actions</h3>
            {record.status === 'PENDING' ? (
              <div className="space-y-3">
                <button onClick={() => handleAction('APPROVED')} disabled={!!actionLoading} className="w-full py-2.5 bg-emerald-600 rounded-xl font-medium">Approve</button>
                <button onClick={() => handleAction('REJECTED')} disabled={!!actionLoading} className="w-full py-2.5 bg-rose-600 rounded-xl font-medium">Reject</button>
              </div>
            ) : <p className="text-sm text-slate-400 italic">No actions available</p>}
          </div>
          <StatusTimeline events={timelineEvents} />
        </div>
      </div>
    </div>
  );
}
