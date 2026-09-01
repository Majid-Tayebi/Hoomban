import type PocketBase from 'pocketbase';
import { PB_NO_AUTO_CANCEL } from '$lib/server/pocketbase';

export type AuditAction = 'create' | 'update' | 'delete' | 'view';

export type AuditLogInput = {
	actorId?: string;
	actorRole?: string;
	action: AuditAction;
	resource: string;
	resourceId?: string;
	patientId?: string;
	summary?: string;
	metadata?: Record<string, unknown>;
	ip?: string;
};

/** Append-only audit trail — admin-only collection, written via admin PB. */
export async function writeAuditLog(pb: PocketBase, input: AuditLogInput): Promise<void> {
	try {
		await pb.collection('audit_log').create(
			{
				actor: input.actorId || '',
				actor_role: input.actorRole || '',
				action: input.action,
				resource: input.resource,
				resource_id: input.resourceId || '',
				patient: input.patientId || '',
				summary: input.summary || '',
				metadata: input.metadata ?? {},
				ip: input.ip || ''
			},
			PB_NO_AUTO_CANCEL
		);
	} catch (err) {
		console.error('[audit_log]', err);
	}
}
