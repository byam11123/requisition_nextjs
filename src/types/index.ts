export type UserRole = 'ADMIN' | 'PURCHASER' | 'MANAGER' | 'ACCOUNTANT' | 'SITE_INCHARGE';

export interface User {
  id: string;
  email: string;
  fullName: string | null;
  role: UserRole;
  organizationId: string;
  department: string | null;
  designation: string | null;
  isActive: boolean;
  pageAccess?: string[];
  rolePageAccess?: string[];
  roleName?: string;
  customRoleKey?: string;
  createdAt: string;
}

export type RequisitionStatus = 'DRAFT' | 'SUBMITTED' | 'APPROVED' | 'REJECTED' | 'PAID' | 'COMPLETED';
export type ApprovalStatus = 'PENDING' | 'TO_REVIEW' | 'HOLD' | 'APPROVED' | 'REJECTED';
export type PaymentStatus = 'NOT_DONE' | 'PARTIAL' | 'DONE';
export type DispatchStatus = 'NOT_DISPATCHED' | 'DISPATCHED' | 'DELIVERED';
export type Priority = 'LOW' | 'NORMAL' | 'HIGH' | 'URGENT';

export interface Requisition {
  id: string;
  organizationId: string;
  requisitionTypeId: string | null;
  createdById: string | null;
  requestId: string | null;
  status: RequisitionStatus;
  approvalStatus: ApprovalStatus;
  paymentStatus: PaymentStatus;
  dispatchStatus: DispatchStatus;
  priority: Priority;
  description: string | null;
  siteAddress: string | null;
  materialDescription: string | null;
  quantity: number | null;
  amount: number | null;
  createdAt: string;
  updatedAt: string;
}

export interface ApiResponse<T> {
  data: T | null;
  error: string | null;
}
