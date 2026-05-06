import { useState, useEffect } from 'react';
import FormSelect from '@/components/ui/form-select';
import { useAuthStore } from '@/modules/auth/hooks/use-auth-store';

export function RepairInfoCard({ repair, updateReq, isMasterLocked, logisticsDraft, updateLogisticsDraft }: any) {
  const { user } = useAuthStore();
  const [localRequestedBy, setLocalRequestedBy] = useState(repair.repairRequisitionByName || "");
  const [localItemDescription, setLocalItemDescription] = useState(repair.itemDescription || "");
  const [localSiteAddress, setLocalSiteAddress] = useState(repair.siteAddress || "");
  const [localVendorName, setLocalVendorName] = useState(repair.repairVendorName || "");
  const [localQuantity, setLocalQuantity] = useState(repair.quantity || 1);
  const [localReturnedBy, setLocalReturnedBy] = useState(repair.returnedByName || "");
  const [localReturnDate, setLocalReturnDate] = useState(repair.dateOfReturn || "");
  const [localDispatchSite, setLocalDispatchSite] = useState(repair.dispatchSite || "");
  const [localDispatchByName, setLocalDispatchByName] = useState(repair.dispatchByName || "");
  const [localReceivedBy, setLocalReceivedBy] = useState(repair.receivedBy || "");
  
  const inputCls = "w-full bg-[var(--app-panel)] border border-[var(--app-border)] rounded-xl px-4 py-2.5 text-[var(--app-text)] outline-none focus:border-[var(--app-accent-border)] text-sm";
  const labelCls = "block text-xs font-semibold text-[var(--app-muted)] uppercase tracking-wider mb-2";

  useEffect(() => { setLocalRequestedBy(repair.repairRequisitionByName || ""); }, [repair.repairRequisitionByName]);
  useEffect(() => { setLocalItemDescription(repair.itemDescription || ""); }, [repair.itemDescription]);
  useEffect(() => { setLocalSiteAddress(repair.siteAddress || ""); }, [repair.siteAddress]);
  useEffect(() => { setLocalVendorName(repair.repairVendorName || ""); }, [repair.repairVendorName]);
  useEffect(() => { setLocalQuantity(repair.quantity || 1); }, [repair.quantity]);
  useEffect(() => { setLocalReturnedBy(repair.returnedByName || ""); }, [repair.returnedByName]);
  useEffect(() => { setLocalReturnDate(repair.dateOfReturn || ""); }, [repair.dateOfReturn]);
  useEffect(() => { setLocalDispatchSite(repair.dispatchSite || ""); }, [repair.dispatchSite]);
  useEffect(() => { setLocalDispatchByName(repair.dispatchByName || ""); }, [repair.dispatchByName]);
  useEffect(() => { setLocalReceivedBy(repair.receivedBy || ""); }, [repair.receivedBy]);

  return (
    <div className="rounded-3xl border border-[var(--app-border)] bg-[var(--app-surface)] p-6">
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
          <input 
            disabled={isMasterLocked} 
            value={localRequestedBy} 
            onChange={(e) => setLocalRequestedBy(e.target.value)}
            onBlur={() => updateReq({ repairRequisitionByName: localRequestedBy })}
            className={inputCls} 
          />
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
          <input 
            disabled={isMasterLocked} 
            value={localItemDescription} 
            onChange={(e) => setLocalItemDescription(e.target.value)}
            onBlur={() => updateReq({ itemDescription: localItemDescription })}
            className={inputCls} 
          />
        </div>
        <div>
          <label className={labelCls}>Site Address</label>
          <input 
            disabled={isMasterLocked} 
            value={localSiteAddress} 
            onChange={(e) => setLocalSiteAddress(e.target.value)}
            onBlur={() => updateReq({ siteAddress: localSiteAddress })}
            className={inputCls} 
          />
        </div>
        <div>
          <label className={labelCls}>Repair Vendor</label>
          <input 
            disabled={isMasterLocked} 
            value={localVendorName} 
            onChange={(e) => setLocalVendorName(e.target.value)}
            onBlur={() => updateReq({ repairVendorName: localVendorName })}
            className={inputCls} 
            placeholder="Vendor name" 
          />
        </div>
        <div>
          <label className={labelCls}>Responsible Person</label>
          <input disabled={true} value={repair.responsiblePersonName || "Not assigned"} className={`${inputCls} opacity-70`} />
        </div>
        <div>
          <label className={labelCls}>Quantity</label>
          <input 
            disabled={isMasterLocked} 
            type="number" 
            value={localQuantity} 
            onChange={(e) => setLocalQuantity(Number(e.target.value))}
            onBlur={() => updateReq({ quantity: Number(localQuantity) })}
            className={inputCls} 
          />
        </div>
        <div>
          <label className={labelCls}>Expected Return</label>
          <input 
            type="date" 
            disabled={isMasterLocked} 
            value={repair.expectedReturnDate || ""} 
            onChange={(e) => updateReq({ expectedReturnDate: e.target.value })} 
            className={inputCls} 
          />
        </div>
        <div>
          <label className={labelCls}>Current Repair Status</label>
          <FormSelect 
            disabled={isMasterLocked} 
            value={repair.repairStatus || "NOT_REPAIRED"} 
            options={[{value:'NOT_REPAIRED', label:'Not Repaired'}, {value:'REPAIRED', label:'Repaired'}]} 
            onChange={(val) => {
              const updates: any = { repairStatus: val };
              if (val === 'REPAIRED' && !repair.returnedByName) {
                updates.returnedByName = user?.fullName || "";
                updates.dateOfReturn = new Date().toISOString().split('T')[0];
              }
              updateReq(updates);
            }} 
          />
        </div>
      </div>

      {repair.repairStatus === "REPAIRED" && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-6 pt-6 border-t border-[var(--app-border)]">
          <div>
            <label className={labelCls}>Returned By (Employee)</label>
            <input 
              disabled={isMasterLocked} 
              value={localReturnedBy} 
              onChange={(e) => setLocalReturnedBy(e.target.value)}
              onBlur={() => updateReq({ returnedByName: localReturnedBy })}
              className={inputCls} 
              placeholder="Who received from vendor"
            />
          </div>
          <div>
            <label className={labelCls}>Date of Return</label>
            <input 
              type="date" 
              disabled={isMasterLocked} 
              value={localReturnDate} 
              onChange={(e) => setLocalReturnDate(e.target.value)}
              onBlur={() => updateReq({ dateOfReturn: localReturnDate })}
              className={inputCls} 
            />
          </div>
        </div>
      )}

      {repair.repairStatus === "REPAIRED" && repair.returnedByName && repair.dateOfReturn && 
       (repair.warrantyStatus === "IN_WARRANTY" || repair.paymentStatus === "DONE") && (
        <div className="mt-6 pt-6 border-t border-[var(--app-border)]">
          <p className="text-xs font-semibold text-indigo-400 uppercase tracking-wider mb-4">Dispatch Details</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className={labelCls}>Dispatch to Site</label>
              <input 
                disabled={isMasterLocked} 
                value={logisticsDraft.dispatchSite || repair.dispatchSite || ""} 
                onChange={(e) => updateLogisticsDraft({ dispatchSite: e.target.value })}
                className={inputCls} 
                placeholder="Target site name"
              />
            </div>
            <div>
              <label className={labelCls}>Dispatched By</label>
              <input 
                disabled={isMasterLocked} 
                value={logisticsDraft.dispatchByName || repair.dispatchByName || ""} 
                onChange={(e) => updateLogisticsDraft({ dispatchByName: e.target.value })}
                className={inputCls} 
                placeholder="Courier or driver"
              />
            </div>
            <div>
              <label className={labelCls}>Dispatch Status</label>
              <FormSelect 
                disabled={isMasterLocked} 
                value={logisticsDraft.dispatchStatus || (repair.dispatchStatus === "DELIVERED" ? "DISPATCHED" : (repair.dispatchStatus || "NOT_DISPATCHED"))} 
                options={[
                  {value:'NOT_DISPATCHED', label:'Not Dispatched'}, 
                  {value:'DISPATCHED', label:'Dispatched'}
                ]} 
                onChange={(val) => updateLogisticsDraft({ dispatchStatus: val })} 
              />
            </div>
            <div>
              <label className={labelCls}>Dispatch Date</label>
              <input 
                disabled={true} 
                value={repair.dispatchedAt ? new Date(repair.dispatchedAt).toLocaleString() : "Awaiting dispatch"} 
                className={`${inputCls} opacity-70`} 
              />
            </div>
          </div>
        </div>
      )}

      {(repair.dispatchStatus === "DISPATCHED" || repair.dispatchStatus === "DELIVERED" || repair.deliveryStatus === "DELIVERED") && 
       (repair.warrantyStatus === "IN_WARRANTY" || repair.approvalStatus === "APPROVED") && (
        <div className="mt-6 pt-6 border-t border-[var(--app-border)] animate-fade-in">
          <p className="text-xs font-semibold text-emerald-400 uppercase tracking-wider mb-4">Delivery Details</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className={labelCls}>Received By</label>
              <input 
                disabled={repair.deliveryStatus === "DELIVERED"} 
                value={logisticsDraft.receivedBy || repair.receivedBy || ""} 
                onChange={(e) => updateLogisticsDraft({ receivedBy: e.target.value })}
                className={inputCls} 
                placeholder="Site personnel"
              />
            </div>
            <div>
              <label className={labelCls}>Delivery Status</label>
              <FormSelect 
                disabled={isMasterLocked} 
                value={logisticsDraft.deliveryStatus || repair.deliveryStatus || "NOT_DELIVERED"} 
                options={[
                  {value:'NOT_DELIVERED', label:'Not Delivered'}, 
                  {value:'DELIVERED', label:'Delivered'}
                ]} 
                onChange={(val) => updateLogisticsDraft({ deliveryStatus: val })} 
              />
            </div>
            <div>
              <label className={labelCls}>Delivery Date</label>
              <input 
                disabled={true} 
                value={repair.receivedDate ? new Date(repair.receivedDate).toLocaleDateString() : "Awaiting confirmation"} 
                className={`${inputCls} opacity-70`} 
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
