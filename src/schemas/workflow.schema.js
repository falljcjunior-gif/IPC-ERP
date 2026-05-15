import { z } from 'zod';

/**
 *  NEXUS OS: WORKFLOW & BPM SCHEMA
 * Handles multi-stage approvals, SLA escalations, and automated business processes.
 */

export const workflowStepSchema = z.object({
  id: z.string(),
  label: z.string(),
  assigned_role: z.string(), // Manager, Finance, SuperAdmin
  status: z.enum(['pending', 'approved', 'rejected', 'skipped']),
  updated_at: z.string(),
  updated_by: z.string().optional(),
  comment: z.string().optional()
});

export const workflowSchema = z.object({
  id: z.string(),
  type: z.enum(['purchase_approval', 'leave_request', 'ticket_escalation', 'access_grant']),
  module: z.enum(['finance', 'hr', 'it', 'crm']),
  status: z.enum(['active', 'completed', 'halted', 'denied']),
  initiator_id: z.string(),
  target_id: z.string(), // The ID of the record being processed (e.g. Purchase ID, Ticket ID)
  steps: z.array(workflowStepSchema),
  current_step_index: z.number().default(0),
  priority: z.enum(['low', 'medium', 'high', 'critical']),
  sla_deadline: z.string(), // ISO string for auto-escalation
  metadata: z.record(z.any()).optional(),
  created_at: z.string(),
  updated_at: z.string()
});

export const approvalRequestSchema = z.object({
  workflow_id: z.string(),
  step_id: z.string(),
  requester_name: z.string(),
  description: z.string(),
  amount: z.number().optional(), // For finance
  urgency: z.enum(['normal', 'emergency'])
});
