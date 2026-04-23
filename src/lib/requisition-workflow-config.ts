export type RequisitionWorkflowStepKey = "approval" | "payment" | "dispatch";

export type RequisitionWorkflowStep = {
  key: RequisitionWorkflowStepKey;
  label: string;
  description: string;
  enabled: boolean;
  roles: string[];
};

export type RequisitionWorkflowConfig = {
  steps: RequisitionWorkflowStep[];
};

export type RequisitionWorkflowRecord = {
  approvalStatus?: string | null;
  paymentStatus?: string | null;
  dispatchStatus?: string | null;
};

export const REQUISITION_WORKFLOW_STEP_ORDER: RequisitionWorkflowStepKey[] = [
  "approval",
  "payment",
  "dispatch",
];

export const DEFAULT_REQUISITION_WORKFLOW_CONFIG: RequisitionWorkflowConfig = {
  steps: [
    {
      key: "approval",
      label: "Approval",
      description: "Review and approve the requisition before finance or dispatch work starts.",
      enabled: true,
      roles: ["ADMIN", "MANAGER"],
    },
    {
      key: "payment",
      label: "Payment",
      description: "Capture finance completion before the requisition moves further.",
      enabled: true,
      roles: ["ADMIN", "ACCOUNTANT"],
    },
    {
      key: "dispatch",
      label: "Dispatch",
      description: "Mark delivery or fulfillment after the required workflow steps are complete.",
      enabled: true,
      roles: ["ADMIN", "PURCHASER"],
    },
  ],
};

export function normalizeWorkflowRoles(value: unknown): string[] | null {
  if (!Array.isArray(value)) {
    return null;
  }

  const roles = value.filter((entry): entry is string => typeof entry === "string" && entry.trim().length > 0);

  return roles.length === value.length ? Array.from(new Set(roles)) : null;
}

export function normalizeRequisitionWorkflowConfig(
  value: unknown,
): RequisitionWorkflowConfig | null {
  if (!value || typeof value !== "object" || !Array.isArray((value as { steps?: unknown[] }).steps)) {
    return null;
  }

  const rawSteps = (value as { steps: unknown[] }).steps;
  const steps: RequisitionWorkflowStep[] = [];

  for (const key of REQUISITION_WORKFLOW_STEP_ORDER) {
    const rawStep = rawSteps.find(
      (entry) => entry && typeof entry === "object" && (entry as { key?: unknown }).key === key,
    );
    if (!rawStep || typeof rawStep !== "object") {
      return null;
    }

    const roles = normalizeWorkflowRoles((rawStep as { roles?: unknown }).roles);
    if (!roles) {
      return null;
    }

    steps.push({
      key,
      label:
        typeof (rawStep as { label?: unknown }).label === "string" &&
        (rawStep as { label: string }).label.trim()
          ? (rawStep as { label: string }).label.trim()
          : DEFAULT_REQUISITION_WORKFLOW_CONFIG.steps.find((step) => step.key === key)?.label || key,
      description:
        typeof (rawStep as { description?: unknown }).description === "string"
          ? (rawStep as { description: string }).description.trim()
          : "",
      enabled: Boolean((rawStep as { enabled?: unknown }).enabled),
      roles,
    });
  }

  return { steps };
}

export function getRequisitionWorkflowStep(
  config: RequisitionWorkflowConfig,
  key: RequisitionWorkflowStepKey,
) {
  return config.steps.find((step) => step.key === key);
}

export function getEnabledRequisitionWorkflowSteps(
  config: RequisitionWorkflowConfig,
) {
  return REQUISITION_WORKFLOW_STEP_ORDER
    .map((key) => getRequisitionWorkflowStep(config, key))
    .filter((step): step is RequisitionWorkflowStep => Boolean(step?.enabled));
}

export function isRequisitionWorkflowStepComplete(
  record: RequisitionWorkflowRecord,
  key: RequisitionWorkflowStepKey,
) {
  if (key === "approval") {
    return record.approvalStatus === "APPROVED";
  }

  if (key === "payment") {
    return record.paymentStatus === "DONE";
  }

  return record.dispatchStatus === "DISPATCHED";
}

export function isRequisitionWorkflowTerminal(record: RequisitionWorkflowRecord) {
  return (
    record.approvalStatus === "REJECTED" ||
    record.approvalStatus === "HOLD" ||
    record.approvalStatus === "TO_REVIEW"
  );
}

export function getPreviousEnabledRequisitionWorkflowStep(
  config: RequisitionWorkflowConfig,
  key: RequisitionWorkflowStepKey,
) {
  const enabledSteps = getEnabledRequisitionWorkflowSteps(config);
  const currentIndex = enabledSteps.findIndex((step) => step.key === key);
  if (currentIndex <= 0) {
    return null;
  }

  return enabledSteps[currentIndex - 1] || null;
}

export function canRunRequisitionWorkflowStep(input: {
  config: RequisitionWorkflowConfig;
  key: RequisitionWorkflowStepKey;
  roleKey?: string | null;
  record: RequisitionWorkflowRecord;
}) {
  const step = getRequisitionWorkflowStep(input.config, input.key);
  if (!step?.enabled) {
    return { allowed: false, reason: "This workflow step is disabled." };
  }

  if (!input.roleKey || !step.roles.includes(input.roleKey)) {
    return { allowed: false, reason: `Only ${step.roles.join(" / ")} can handle this step.` };
  }

  if (isRequisitionWorkflowTerminal(input.record) && input.key !== "approval") {
    return { allowed: false, reason: "This requisition is no longer moving forward in the workflow." };
  }

  if (isRequisitionWorkflowStepComplete(input.record, input.key)) {
    return { allowed: false, reason: "This workflow step is already complete." };
  }

  if (input.key === "approval" && input.record.approvalStatus && input.record.approvalStatus !== "PENDING") {
    return { allowed: false, reason: "Approval is no longer pending." };
  }

  const previousStep = getPreviousEnabledRequisitionWorkflowStep(input.config, input.key);
  if (previousStep && !isRequisitionWorkflowStepComplete(input.record, previousStep.key)) {
    return {
      allowed: false,
      reason: `${previousStep.label} must be completed first.`,
    };
  }

  return { allowed: true, reason: null };
}
