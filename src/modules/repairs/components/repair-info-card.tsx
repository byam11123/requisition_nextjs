import FormSelect from '@/components/ui/form-select';

export function RepairInfoCard({ repair, updateReq, isMasterLocked }: any) {
  const inputCls = "w-full bg-[var(--app-panel)] border border-[var(--app-border)] rounded-xl px-4 py-2.5 text-[var(--app-text)] outline-none focus:border-[var(--app-accent-border)] text-sm";
  const labelCls = "block text-xs font-semibold text-[var(--app-muted)] uppercase tracking-wider mb-2";

  return (
    <div className="rounded-3xl border border-[var(--app-border)] bg-[var(--app-surface)] p-6 backdrop-blur-sm">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <div>
          <label className={labelCls}>Priority</label>
          <FormSelect 
            disabled={isMasterLocked} 
            value={repair.priority || "NORMAL"} 
            options={[{value:'LOW', label:'Low'}, {value:'NORMAL', label:'Normal'}, {value:'HIGH', label:'High'}, {value:'URGENT', label:'Urgent'}]} 
            onChange={(val) => updateReq({ priority: val })} 
          />
        </div>
        <div>
          <label className={labelCls}>Requested By</label>
          <input disabled={isMasterLocked} value={repair.repairRequisitionByName || ""} onChange={(e) => updateReq({ repairRequisitionByName: e.target.value })} className={inputCls} />
        </div>
        <div>
          <label className={labelCls}>Warranty</label>
          <FormSelect 
            disabled={isMasterLocked} 
            value={repair.warrantyStatus || "OUT_OF_WARRANTY"} 
            options={[{value:'IN_WARRANTY', label:'In Warranty'}, {value:'OUT_OF_WARRANTY', label:'Out of Warranty'}]} 
            onChange={(val) => updateReq({ warrantyStatus: val })} 
          />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="sm:col-span-2">
          <label className={labelCls}>Item Description</label>
          <input disabled={isMasterLocked} value={repair.itemDescription || ""} onChange={(e) => updateReq({ itemDescription: e.target.value })} className={inputCls} />
        </div>
        <div>
          <label className={labelCls}>Site Address</label>
          <input disabled={isMasterLocked} value={repair.siteAddress || ""} onChange={(e) => updateReq({ siteAddress: e.target.value })} className={inputCls} />
        </div>
        <div>
          <label className={labelCls}>Quantity</label>
          <input disabled={isMasterLocked} type="number" value={repair.quantity || 1} onChange={(e) => updateReq({ quantity: Number(e.target.value) })} className={inputCls} />
        </div>
      </div>
    </div>
  );
}
