"use client";

import { useState } from "react";
import { X, Calendar, Wallet, FileText, Hash, CheckCircle2 } from "lucide-react";
import { formatDate } from "@/utils/format";
import ImagePreviewModal from "@/components/ui/image-preview-modal";

interface HistoryDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  record: any;
}

export default function HistoryDetailModal({ isOpen, onClose, record }: HistoryDetailModalProps) {
  const [previewData, setPreviewData] = useState<{ url: string; title: string } | null>(null);

  if (!isOpen || !record) return null;

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in text-slate-100">
        <div className="w-full max-w-2xl rounded-3xl border border-white/10 bg-slate-900 p-6 shadow-2xl animate-scale-in max-h-[90vh] overflow-y-auto custom-scrollbar">
          <div className="flex items-center justify-between mb-8 border-b border-white/5 pb-4">
            <div>
              <p className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest mb-1">Advance Record</p>
              <h2 className="text-xl font-bold uppercase tracking-tight">{record.request_id}</h2>
            </div>
            <button onClick={onClose} className="p-2 rounded-full hover:bg-white/5 text-slate-400 transition-colors">
              <X size={20} />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Core Info */}
            <div className="space-y-6">
              <div className="bg-white/5 p-4 rounded-2xl border border-white/5">
                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-3 flex items-center gap-2">
                  <FileText size={12} /> Advance Details
                </p>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-xs text-slate-400">Amount:</span>
                    <span className="text-sm font-bold text-slate-100">₹{record.requested_amount}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-xs text-slate-400">Type:</span>
                    <span className="text-xs font-bold text-indigo-400 px-2 py-0.5 bg-indigo-400/10 rounded-full border border-indigo-400/20">{record.request_type}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-xs text-slate-400">Status:</span>
                    <span className={`text-xs font-bold px-2 py-0.5 rounded-full border ${
                      record.status === 'PAID' ? 'text-emerald-400 border-emerald-500/20 bg-emerald-500/5' : 'text-amber-400 border-amber-500/20 bg-amber-500/5'
                    }`}>
                      {record.status === 'PAID' ? 'DISBURSED' : record.status}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-xs text-slate-400">Date:</span>
                    <span className="text-xs text-slate-300">{formatDate(record.created_at)}</span>
                  </div>
                </div>
              </div>

              <div className="bg-white/5 p-4 rounded-2xl border border-white/5">
                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-3 flex items-center gap-2">
                  <Wallet size={12} /> Payment Information
                </p>
                {record.status === 'PAID' ? (
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-xs text-slate-400">Mode:</span>
                      <span className="text-xs text-slate-200">{record.payment_mode}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-xs text-slate-400">Ref ID:</span>
                      <span className="text-xs font-mono text-slate-300">{record.payment_reference}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-xs text-slate-400">Paid At:</span>
                      <span className="text-xs text-slate-300">{formatDate(record.paid_at)}</span>
                    </div>
                  </div>
                ) : (
                  <p className="text-xs text-slate-500 italic py-2">Payment not yet released.</p>
                )}
              </div>

              <div className="bg-white/5 p-4 rounded-2xl border border-white/5">
                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2 flex items-center gap-2">
                  Remarks
                </p>
                <p className="text-xs text-slate-400 leading-relaxed italic">
                  {record.remarks || 'No remarks provided.'}
                </p>
              </div>
            </div>

            {/* Evidence / Photos */}
            <div className="space-y-6">
              <div>
                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-3">Slip Photo</p>
                {record.slip_photo_url ? (
                  <button 
                    onClick={() => setPreviewData({ url: record.slip_photo_url, title: "Slip Photo" })}
                    className="group relative block w-full aspect-video overflow-hidden rounded-2xl border border-white/10 bg-slate-950 text-left"
                  >
                    <img src={record.slip_photo_url} alt="Slip" className="h-full w-full object-cover transition-transform group-hover:scale-105" />
                    <div className="absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 transition-opacity group-hover:opacity-100">
                      <p className="text-xs font-medium text-white">Click to Enlarge</p>
                    </div>
                  </button>
                ) : (
                  <div className="aspect-video rounded-2xl border border-dashed border-white/5 bg-slate-950/50 flex items-center justify-center">
                    <p className="text-[10px] text-slate-600">No slip attached</p>
                  </div>
                )}
              </div>

              <div>
                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-3">Disbursement Proof</p>
                {record.payment_photo_url ? (
                  <button 
                    onClick={() => setPreviewData({ url: record.payment_photo_url, title: "Disbursement Proof" })}
                    className="group relative block w-full aspect-video overflow-hidden rounded-2xl border border-white/10 bg-slate-950 text-left"
                  >
                    <img src={record.payment_photo_url} alt="Payment Proof" className="h-full w-full object-cover transition-transform group-hover:scale-105" />
                    <div className="absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 transition-opacity group-hover:opacity-100">
                      <p className="text-xs font-medium text-white">Click to Enlarge</p>
                    </div>
                  </button>
                ) : (
                  <div className="aspect-video rounded-2xl border border-dashed border-white/5 bg-slate-950/50 flex items-center justify-center">
                    <p className="text-[10px] text-slate-600">No payment proof attached</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="mt-8 pt-6 border-t border-white/5">
            <button
              onClick={onClose}
              className="w-full py-3 bg-white/5 hover:bg-white/10 border border-white/5 rounded-2xl text-sm font-bold transition-all text-slate-300"
            >
              Close Details
            </button>
          </div>
        </div>
      </div>

      {/* Global Image Preview Modal */}
      {previewData && (
        <ImagePreviewModal 
          isOpen={!!previewData}
          onClose={() => setPreviewData(null)}
          imageUrl={previewData.url}
          title={previewData.title}
        />
      )}
    </>
  );
}
