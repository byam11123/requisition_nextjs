import { getEffectiveRoleContext } from "@/lib/effective-role-context";

export type PermissionKey =
  | "requisition.view" | "requisition.create" | "requisition.edit" | "requisition.submit"
  | "requisition.approve" | "requisition.hold" | "requisition.pay"
  | "requisition.dispatch" | "requisition.deliver" | "requisition.delete"
  | "requisition.upload.bill" | "requisition.upload.material" | "requisition.upload.payment"
  | "repair.view" | "repair.create" | "repair.approve" | "repair.pay" | "repair.dispatch" | "repair.delete"
  | "fuel.view" | "fuel.create" | "fuel.approve" | "fuel.upload.bill" | "fuel.delete"
  | "attendance.view" | "attendance.create" | "attendance.approve" | "attendance.delete"
  | "salaryAdvance.view" | "salaryAdvance.create" | "salaryAdvance.approve" | "salaryAdvance.delete"
  | "store.view" | "store.create" | "store.edit" | "store.delete"
  | "users.manage" | "roles.manage" | "workflow.manage" | "organization.manage";

export type ResolvedPermissions = Set<PermissionKey>;

export const BASE_ROLE_PERMISSIONS: Record<string, PermissionKey[]> = {
  ADMIN: [
    "requisition.view","requisition.create","requisition.edit","requisition.submit",
    "requisition.approve","requisition.hold","requisition.pay",
    "requisition.dispatch","requisition.deliver","requisition.delete",
    "requisition.upload.bill","requisition.upload.material","requisition.upload.payment",
    "repair.view","repair.create","repair.approve","repair.pay","repair.dispatch","repair.delete",
    "fuel.view","fuel.create","fuel.approve","fuel.upload.bill","fuel.delete",
    "attendance.view","attendance.create","attendance.approve","attendance.delete",
    "salaryAdvance.view","salaryAdvance.create","salaryAdvance.approve","salaryAdvance.delete",
    "store.view","store.create","store.edit","store.delete",
    "users.manage","roles.manage","workflow.manage","organization.manage",
  ],
  MANAGER: [
    "requisition.view","requisition.approve","requisition.hold",
    "repair.view","repair.approve",
    "fuel.view","fuel.approve",
    "attendance.view","attendance.approve",
    "salaryAdvance.view","salaryAdvance.approve",
    "store.view",
  ],
  ACCOUNTANT: [
    "requisition.view","requisition.pay","requisition.upload.payment",
    "repair.view","repair.pay",
    "fuel.view",
    "salaryAdvance.view","salaryAdvance.create","salaryAdvance.approve",
    "store.view",
  ],
  PURCHASER: [
    "requisition.view","requisition.create","requisition.edit","requisition.submit",
    "requisition.dispatch","requisition.deliver",
    "requisition.upload.bill","requisition.upload.material",
    "repair.view","repair.create","repair.dispatch",
    "fuel.view","fuel.create","fuel.upload.bill",
    "attendance.view","attendance.create",
    "store.view","store.create",
  ],
};

export interface ResolvePermissionsInput {
  userId: string;
  baseRole: string;
  organizationId?: bigint | string | null;
}

export async function resolvePermissions(input: ResolvePermissionsInput): Promise<ResolvedPermissions> {
  const base = (BASE_ROLE_PERMISSIONS[input.baseRole] ?? []) as PermissionKey[];
  // ADMIN always gets full permissions without a DB lookup
  if (input.baseRole === "ADMIN") return new Set(base);
  try {
    const ctx = await getEffectiveRoleContext({ userId: input.userId, baseRole: input.baseRole, organizationId: input.organizationId });
    // If no custom role is configured for this org, fall back to the base role permissions
    if (!ctx) return new Set(base);
    // Use the baseRole of the matched custom role (e.g. a custom "Site Manager" role whose baseRole is "MANAGER")
    // to look up the correct permission set. Fall back to the caller's own base permissions if nothing matches.
    const effective = (BASE_ROLE_PERMISSIONS[ctx.baseRole] ?? base) as PermissionKey[];
    return new Set(effective);
  } catch { return new Set(base); }
}

export function hasPermission(perms: ResolvedPermissions, key: PermissionKey): boolean {
  return perms.has(key);
}

export async function checkPermission(input: ResolvePermissionsInput, key: PermissionKey): Promise<boolean> {
  const perms = await resolvePermissions(input);
  return perms.has(key);
}
