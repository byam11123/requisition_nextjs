"use client";

import Link from "next/link";
import { use, useEffect, useMemo, useState } from "react";
import { ArrowLeft, CheckCircle2, Loader2, XCircle, ReceiptText, Upload } from "lucide-react";
import AttachmentCard from "@/app/dashboard/components/attachment-card";
import { DetailInfoRow } from "@/app/dashboard/components/detail-info";
import StatusTimeline, { type TimelineEvent } from "@/modules/common/components/status-timeline";
import StatusChip from "@/components/ui/status-chip";
import { formatDate } from "@/utils/format";

export default function VehicleFuelDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [record, setRecord] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      try {
        const token = localStorage.getItem("token");
        const res = await fetch(`/api/vehicle-fuel/${id}`, { headers: { Authorization: `Bearer ${token}` } });
        setRecord(await res.json());
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [id]);

  const handleAction = async (approvalStatus: string) => {
    setActionLoading(approvalStatus);
    try {
      const token = localStorage.getItem("token");
      await fetch(`/api/vehicle-fuel/${id}/approve`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({ approvalStatus }),
      });
      setRecord((r:any) => ({ ...r, status: approvalStatus }));
    } finally {
      setActionLoading(null);
    }
  };

  const timelineEvents = useMemo<TimelineEvent[]>(() => {
    if (!record) return [];
    return [
      { key: "created", title: "Fuel Request Created", description: `Requested ${record.currentRequirementLitres}L for ${record.vehicleType}.`, timestamp: record.entryTimestamp, state: "done" },
      { key: "approval", title: record.status, description: `Status: ${record.status}`, timestamp: null, state: record.status === 'PENDING' ? 'current' : 'done' },
    ];
  }, [record]);

  if (loading) return <div className="flex h-64 items-center justify-center"><Loader2 className="animate-spin text-indigo-500" size={32} /></div>;
  if (!record) return <p className="py-12 text-center text-slate-400">Record not found</p>;

  return (
    <div className="mx-auto max-w-6xl space-y-6 animate-fade-in-up">
      <Link href="/dashboard/vehicle-fuel" className="inline-flex items-center gap-2 text-sm text-indigo-400 hover:text-indigo-300 transition-colors">
        <ArrowLeft size={16} /> Back to Fuel Register
      </Link>

      <div className="flex flex-col gap-6 lg:flex-row">
        <div className="flex-1 space-y-6">
          <div className="rounded-3xl border border-white/5 bg-slate-900/50 p-8">
            <div className="flex justify-between items-start mb-6">
              <div>
                <p className="text-xs uppercase tracking-wider text-slate-500 mb-1">Request ID</p>
                <h1 className="text-2xl font-bold">{record.requestId}</h1>
              </div>
              <StatusChip tone={record.status === 'APPROVED' ? 'emerald' : 'amber'}>{record.status}</StatusChip>
            </div>

            <div className="space-y-6">
              <DetailInfoRow label="RC No." value={record.rcNo} />
              <DetailInfoRow label="Vehicle Type" value={record.vehicleType} />
              <DetailInfoRow label="Requirement" value={`${record.currentRequirementLitres} Litres`} />
              <DetailInfoRow label="Running" value={`${record.totalRunning} KM`} />
              <DetailInfoRow label="Reading Photo" value={<div className="w-48"><AttachmentCard title="Evidence" url={record.lastReadingPhotoUrl} /></div>} />
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
            ) : <p className="text-sm text-slate-400 italic">No remaining actions</p>}
          </div>
          <StatusTimeline events={timelineEvents} />
        </div>
      </div>
    </div>
  );
}
