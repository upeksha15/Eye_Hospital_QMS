import AuditLog from '../models/AuditLog.js';

export async function createAuditLog({
  action,
  category = 'system',
  description,
  actorId,
  actorName = '',
  meta,
}) {
  try {
    await AuditLog.create({
      action,
      category,
      description,
      actorId,
      actorName,
      meta,
    });
  } catch (e) {
    console.error('createAuditLog failed', e);
  }
}
