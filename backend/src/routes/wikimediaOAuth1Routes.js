import express from 'express';

// Minimal shim for Wikimedia OAuth1 routes used in tests
// Implement real OAuth1 flows as needed. For tests we only need the module to exist.
const router = express.Router();

// Example placeholder endpoints (optional)
router.get('/init', (req, res) => res.status(501).json({ success: false, message: 'Not implemented' }));
router.get('/callback', (req, res) => res.status(501).json({ success: false, message: 'Not implemented' }));

export default router;
