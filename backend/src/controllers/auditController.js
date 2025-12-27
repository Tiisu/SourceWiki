import AuditLog from '../models/AuditLog.js';

export const getAuditLogs = async (req, res) => {
  const logs = await AuditLog
    .find()
    .populate('userId', 'username email')
    .sort({ createdAt: -1 });

  res.json(logs);
};
