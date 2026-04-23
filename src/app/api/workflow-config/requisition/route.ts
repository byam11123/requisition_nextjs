import { NextRequest, NextResponse } from "next/server";

import { getUserFromRequest } from "@/lib/auth";
import {
  DEFAULT_REQUISITION_WORKFLOW_CONFIG,
  normalizeRequisitionWorkflowConfig,
} from "@/lib/requisition-workflow-config";
import {
  getRequisitionWorkflowOrganizationScope,
  getRequisitionWorkflowConfig,
  saveRequisitionWorkflowConfig,
} from "@/lib/requisition-workflow-store";

export async function GET(req: NextRequest) {
  const user = getUserFromRequest(req);
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const organizationScope = await getRequisitionWorkflowOrganizationScope(user.sub);
    if (!organizationScope) {
      return NextResponse.json(DEFAULT_REQUISITION_WORKFLOW_CONFIG);
    }

    const config = await getRequisitionWorkflowConfig(organizationScope);
    return NextResponse.json(config);
  } catch (error) {
    console.error("Workflow config GET error:", error);
    return NextResponse.json(DEFAULT_REQUISITION_WORKFLOW_CONFIG);
  }
}

export async function PUT(req: NextRequest) {
  const user = getUserFromRequest(req);
  if (!user || user.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const normalized = normalizeRequisitionWorkflowConfig(body);
    if (!normalized) {
      return NextResponse.json({ error: "Invalid workflow configuration" }, { status: 400 });
    }

    const organizationScope = await getRequisitionWorkflowOrganizationScope(user.sub);
    if (!organizationScope) {
      return NextResponse.json({ error: "Organization not found" }, { status: 404 });
    }

    const saved = await saveRequisitionWorkflowConfig(organizationScope, normalized);
    return NextResponse.json(saved);
  } catch (error) {
    console.error("Workflow config PUT error:", error);
    return NextResponse.json({ error: "Unable to save workflow configuration" }, { status: 500 });
  }
}
