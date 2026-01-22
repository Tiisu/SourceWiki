import { AuditLogModel } from '../models/AuditLog';

export const createAuditLog = async (opts: {
  action: string;
  resource?: string;
  method?: string;
  user?: { id?: string; username?: string } | null;
  details?: any;
}) => {
  try {
    const log = new AuditLogModel({
      action: opts.action,
      resource: opts.resource,
      method: opts.method,
      user: opts.user ?? null,
      details: opts.details ?? {},
    });
    await log.save();
    return log;
  } catch (err) {
    console.error('Failed to create audit log', err);
    return null;
  }
};