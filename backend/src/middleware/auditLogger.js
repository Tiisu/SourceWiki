import AuditLog from '../models/AuditLog.js';

const auditLogger = (action, resource) => {
  return (req, res, next) => {
    res.on('finish', async () => {
      if (!req.user) return;

      try {
        await AuditLog.create({
          userId: req.user._id,
          action,
          resource,
          method: req.method,
          ip: req.ip
        });
      } catch (err) {
        console.error('Audit log failed:', err.message);
      }
    });

    next();
  };
};

export default auditLogger;
