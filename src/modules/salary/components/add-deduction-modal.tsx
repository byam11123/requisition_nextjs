"use client";

import { useState } from "react";
import { X, Calendar, IndianRupee, MessageSquare, Loader2 } from "lucide-react";

interface AddDeductionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (data: { deductionDate: string; deductionAmount: number; remark: string }) => Promise<void>;
}

export default function AddDeductionModal({ isOpen, onClose, onConfirm }: AddDeductionModalProps) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    deductionDate: new Date().toISOString().split('T')[0],
    deductionAmount: "",
    remark: "",
  });

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.deductionAmount || Number(formData.deductionAmount) <= 0) return;

    setLoading(true);
    try {
      await onConfirm({
        deductionDate: formData.deductionDate,
        deductionAmount: Number(formData.deductionAmount),
        remark: formData.remark,
      });
      setFormData({
        deductionDate: new Date().toISOString().split('T')[0],
        deductionAmount: "",
        remark: "",
      });
      onClose();
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="w-full max-w-md rounded-3xl border border-white/10 bg-slate-900 p-6 shadow-2xl animate-scale-in">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-bold text-slate-100 uppercase tracking-wider">Add Deduction</h2>
          <button onClick={onClose} className="p-1 rounded-full hover:bg-white/5 text-slate-400 transition-colors">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1.5 ml-1">
              Deduction Date
            </label>
            <div className="relative group">
              <Calendar size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-indigo-400 transition-colors" />
              <input
                type="date"
                required
                value={formData.deductionDate}
                onChange={(e) => setFormData({ ...formData, deductionDate: e.target.value })}
                className="w-full bg-slate-950/50 border border-white/5 rounded-xl pl-10 pr-4 py-2.5 text-sm text-slate-200 outline-none focus:border-indigo-500/50 transition-colors"
              />
            </div>
          </div>

          <div>
            <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1.5 ml-1">
              Deduction Amount (₹)
            </label>
            <div className="relative group">
              <IndianRupee size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-indigo-400 transition-colors" />
              <input
                type="number"
                required
                min="1"
                placeholder="0"
                value={formData.deductionAmount}
                onChange={(e) => setFormData({ ...formData, deductionAmount: e.target.value })}
                className="w-full bg-slate-950/50 border border-white/5 rounded-xl pl-10 pr-4 py-2.5 text-sm text-slate-200 outline-none focus:border-indigo-500/50 transition-colors"
              />
            </div>
          </div>

          <div>
            <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1.5 ml-1">
              Remark
            </label>
            <div className="relative group">
              <MessageSquare size={16} className="absolute left-3.5 top-4 text-slate-500 group-focus-within:text-indigo-400 transition-colors" />
              <textarea
                placeholder="Enter repayment remark..."
                value={formData.remark}
                onChange={(e) => setFormData({ ...formData, remark: e.target.value })}
                rows={3}
                className="w-full bg-slate-950/50 border border-white/5 rounded-xl pl-10 pr-4 py-2.5 text-sm text-slate-200 outline-none focus:border-indigo-500/50 transition-colors resize-none"
              />
            </div>
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2.5 rounded-xl border border-white/5 text-sm font-medium text-slate-300 hover:bg-white/5 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-4 py-2.5 rounded-xl bg-indigo-600 text-sm font-bold text-white shadow-lg shadow-indigo-600/20 hover:bg-indigo-500 disabled:opacity-50 transition-colors flex items-center justify-center gap-2"
            >
              {loading ? <Loader2 size={16} className="animate-spin" /> : null}
              Confirm Entry
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
