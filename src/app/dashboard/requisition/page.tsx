"use client";

import { useEffect, useState } from 'react';
import { useAuthStore } from '@/modules/auth/hooks/use-auth-store';
import { RequisitionRegister } from '@/modules/requisitions/components/requisition-register';
import { DEFAULT_REQUISITION_WORKFLOW_CONFIG } from '@/lib/config/requisition-workflow-config';

export default function RequisitionPage() {
  const { user } = useAuthStore();
  const [workflowConfig, setWorkflowConfig] = useState(DEFAULT_REQUISITION_WORKFLOW_CONFIG);

  useEffect(() => {
    const fetchWorkflowConfig = async () => {
      try {
        const token = useAuthStore.getState().token;
        const res = await fetch('/api/workflow-config/requisition', {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) {
          setWorkflowConfig(await res.json());
        }
      } catch (error) {
        console.error(error);
      }
    };
    fetchWorkflowConfig();
  }, []);

  if (!user) return null;

  return <RequisitionRegister user={user} workflowConfig={workflowConfig} />;
}


