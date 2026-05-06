"use client";

import { useState, useRef } from "react";
import { X, CreditCard, Hash, Loader2, Camera, Upload } from "lucide-react";
import { supabase } from "@/lib/supabase";

interface ConfirmPaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (data: { paymentMode: string; paymentReference: string; paymentPhotoUrl?: string }) => Promise<void>;
}

export default function ConfirmPaymentModal({ isOpen, onClose, onConfirm }: ConfirmPaymentModalProps) {
  const [loading, setLoading] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [formData, setFormData] = useState({
    paymentMode: "Bank Transfer",
    paymentReference: "",
  });

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.paymentReference) return;

    setLoading(true);
    try {
      let photoUrl = undefined;
      
      if (file) {
        const fileExt = file.name.split('.').pop();
        const fileName = `${Math.random()}.${fileExt}`;
        const filePath = `payments/${Date.now()}-${fileName}`;

        const { data, error: uploadError } = await supabase.storage
          .from('requisitions')
          .upload(filePath, file);

        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = supabase.storage
          .from('requisitions')
          .getPublicUrl(filePath);
          
        photoUrl = publicUrl;
      }

      await onConfirm({ ...formData, paymentPhotoUrl: photoUrl });
      onClose();
    } catch (err: any) {
      console.error("Upload error:", err);
      // Parent should handle display, but we can log here
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in text-slate-100">
      <div className="w-full max-w-md rounded-3xl border border-white/10 bg-slate-900 p-6 shadow-2xl animate-scale-in">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-bold uppercase tracking-wider">Confirm Payment</h2>
          <button onClick={onClose} className="p-1 rounded-full hover:bg-white/5 text-slate-400 transition-colors">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1.5 ml-1">
              Payment Mode
            </label>
            <div className="relative group">
              <CreditCard size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-indigo-400 transition-colors" />
              <select
                required
                value={formData.paymentMode}
                onChange={(e) => setFormData({ ...formData, paymentMode: e.target.value })}
                className="w-full bg-slate-950/50 border border-white/5 rounded-xl pl-10 pr-4 py-2.5 text-sm text-slate-200 outline-none focus:border-indigo-500/50 transition-colors appearance-none cursor-pointer"
              >
                <option value="Bank Transfer">Bank Transfer</option>
                <option value="Cash">Cash</option>
                <option value="Check">Check</option>
                <option value="UPI">UPI</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1.5 ml-1">
              Payment Reference (UTR / Check No / Txn ID)
            </label>
            <div className="relative group">
              <Hash size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-indigo-400 transition-colors" />
              <input
                type="text"
                required
                placeholder="Enter transaction reference..."
                value={formData.paymentReference}
                onChange={(e) => setFormData({ ...formData, paymentReference: e.target.value })}
                className="w-full bg-slate-950/50 border border-white/5 rounded-xl pl-10 pr-4 py-2.5 text-sm text-slate-200 outline-none focus:border-indigo-500/50 transition-colors"
              />
            </div>
          </div>

          <div>
            <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1.5 ml-1">
              Payment Proof (Image)
            </label>
            <div 
              onClick={() => fileInputRef.current?.click()}
              className={`relative flex flex-col items-center justify-center gap-2 py-6 border-2 border-dashed rounded-2xl cursor-pointer transition-all ${
                file ? 'border-emerald-500/50 bg-emerald-500/5' : 'border-white/5 bg-slate-950/30 hover:border-indigo-500/30'
              }`}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={(e) => setFile(e.target.files?.[0] || null)}
                className="hidden"
              />
              {file ? (
                <>
                  <div className="flex items-center gap-2 text-emerald-400">
                    <Camera size={18} />
                    <span className="text-xs font-medium truncate max-w-[200px]">{file.name}</span>
                  </div>
                  <span className="text-[10px] text-slate-500">Click to change photo</span>
                </>
              ) : (
                <>
                  <Upload size={20} className="text-slate-500" />
                  <span className="text-xs text-slate-400">Upload transfer receipt / check photo</span>
                </>
              )}
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
              className="flex-1 px-4 py-2.5 rounded-xl bg-emerald-600 text-sm font-bold text-white shadow-lg shadow-emerald-600/20 hover:bg-emerald-500 disabled:opacity-50 transition-colors flex items-center justify-center gap-2"
            >
              {loading ? <Loader2 size={16} className="animate-spin" /> : null}
              {loading ? "Processing..." : "Release Payment"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
