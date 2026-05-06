export function canPerformStep(
  step: 'approve' | 'pay' | 'dispatch',
  record: { approverId?: bigint | string | null, payerId?: bigint | string | null, dispatcherId?: bigint | string | null },
  user: { sub: string, role: string }
): boolean {
  // ADMIN always wins
  if (user.role === 'ADMIN') return true;

  const userId = user.sub;

  const recApproverId = record.approverId ? String(record.approverId) : null;
  const recPayerId = record.payerId ? String(record.payerId) : null;
  const recDispatcherId = record.dispatcherId ? String(record.dispatcherId) : null;

  switch (step) {
    case 'approve':  return recApproverId === userId;
    case 'pay':      return recPayerId === userId;
    case 'dispatch': return recDispatcherId === userId;
    default: return false;
  }
}
