import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import { UserModel } from '../models/User';
import { SettingsModel } from '../models/Settings';
import { createAuditLog } from '../utils/audit';
import { Types } from 'mongoose';
import { AuditLogModel } from '../models/AuditLog';

/* Users CRUD */

export const listUsers = async (req: AuthRequest, res: Response) => {
  try {
    const users = await UserModel.find().sort({ username: 1 }).lean();
    res.json(users);
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to fetch users' });
  }
};

export const createUser = async (req: AuthRequest, res: Response) => {
  try {
    const { username, email, country, role, points, badges, joinDate, password } = req.body;
    const user = new UserModel({ username, email, country, role, points: points ?? 0, badges: badges ?? [], joinDate, password });
    await user.save();

    await createAuditLog({
      action: 'CREATE_USER',
      resource: 'User',
      method: 'POST',
      user: { id: req.user?.id, username: req.user?.username },
      details: { createdUserId: user._id, email: user.email, role: user.role },
    });

    res.status(201).json(user);
  } catch (err) {
    res.status(400).json({ success: false, message: 'Failed to create user', error: err instanceof Error ? err.message : err });
  }
};

export const updateUser = async (req: AuthRequest, res: Response) => {
  try {
    const id = req.params.id;
    if (!Types.ObjectId.isValid(id) && typeof id !== 'string') {
      // allow string ids from mock-data too
    }
    const updates = { ...req.body };
    delete (updates as any)._id;

    const user = await UserModel.findByIdAndUpdate(id, updates, { new: true }).lean();
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });

    await createAuditLog({
      action: 'UPDATE_USER',
      resource: 'User',
      method: 'PUT',
      user: { id: req.user?.id, username: req.user?.username },
      details: { updatedUserId: user._id, updates },
    });

    res.json(user);
  } catch (err) {
    res.status(400).json({ success: false, message: 'Failed to update user', error: err instanceof Error ? err.message : err });
  }
};

export const deleteUser = async (req: AuthRequest, res: Response) => {
  try {
    const id = req.params.id;
    const user = await UserModel.findByIdAndDelete(id).lean();
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });

    await createAuditLog({
      action: 'DELETE_USER',
      resource: 'User',
      method: 'DELETE',
      user: { id: req.user?.id, username: req.user?.username },
      details: { deletedUserId: user._id, email: user.email },
    });

    res.json({ success: true });
  } catch (err) {
    res.status(400).json({ success: false, message: 'Failed to delete user', error: err instanceof Error ? err.message : err });
  }
};

/* Settings */

export const getSettings = async (req: AuthRequest, res: Response) => {
  try {
    let settings = await SettingsModel.findOne().lean();
    if (!settings) {
      const s = new SettingsModel({});
      await s.save();
      settings = s.toObject();
    }
    res.json(settings);
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to fetch settings' });
  }
};

export const updateSettings = async (req: AuthRequest, res: Response) => {
  try {
    const updates = req.body;
    let settings = await SettingsModel.findOne();
    if (!settings) {
      settings = new SettingsModel(updates);
    } else {
      settings.siteName = updates.siteName ?? settings.siteName;
      settings.verificationPoints = updates.verificationPoints ?? settings.verificationPoints;
      settings.maxSubmissionsPerDay = updates.maxSubmissionsPerDay ?? settings.maxSubmissionsPerDay;
      settings.updatedAt = new Date();
    }
    await settings.save();

    await createAuditLog({
      action: 'UPDATE_SETTINGS',
      resource: 'Settings',
      method: 'PUT',
      user: { id: req.user?.id, username: req.user?.username },
      details: { updates },
    });

    res.json(settings.toObject());
  } catch (err) {
    res.status(400).json({ success: false, message: 'Failed to update settings', error: err instanceof Error ? err.message : err });
  }
};

/* Audit logs listing */

export const listAuditLogs = async (req: AuthRequest, res: Response) => {
  try {
    const q: any = {};
    if (req.query.action) q.action = String(req.query.action);
    if (req.query.user) {
      q['user.username'] = String(req.query.user);
    }
    const logs = await AuditLogModel.find(q).sort({ createdAt: -1 }).limit(1000).lean();
    res.json(logs);
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to fetch audit logs' });
  }
};