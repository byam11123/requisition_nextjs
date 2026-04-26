import AttachmentCard from '@/app/dashboard/components/attachment-card';

export function RepairAttachments({ repair, onUpload, isMasterLocked }: any) {
  const isRepaired = repair.repairStatus === 'REPAIRED';
  const isOutOfWarranty = repair.warrantyStatus === 'OUT_OF_WARRANTY';

  return (
    <div className="rounded-3xl border border-[var(--app-border)] bg-[var(--app-surface)] p-6 backdrop-blur-sm">
      <h3 className="text-lg font-semibold text-[var(--app-text)] mb-4">Attachments & Proofs</h3>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <AttachmentCard
          title="Before Photo"
          url={repair.repairStatusBeforePhoto}
          canUpload={!isMasterLocked}
          onUpload={(e: any) => e.target.files?.[0] && onUpload(e.target.files[0], "MATERIAL")}
        />
        {isRepaired && (
          <AttachmentCard
            title="After Photo"
            url={repair.repairStatusAfterPhoto}
            canUpload={!isMasterLocked}
            onUpload={(e: any) => e.target.files?.[0] && onUpload(e.target.files[0], "REPAIR_AFTER")}
          />
        )}
        {isRepaired && isOutOfWarranty && (
          <>
            <AttachmentCard
              title="Bill / Invoice"
              url={repair.billInvoicePhoto}
              canUpload={!isMasterLocked}
              onUpload={(e: any) => e.target.files?.[0] && onUpload(e.target.files[0], "BILL")}
            />
            <AttachmentCard
              title="Payment Proof"
              url={repair.paymentProofPhoto}
              canUpload={!isMasterLocked}
              onUpload={(e: any) => e.target.files?.[0] && onUpload(e.target.files[0], "PAYMENT")}
            />
          </>
        )}
      </div>
    </div>
  );
}
