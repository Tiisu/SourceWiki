import express from 'express';
import {
  initiateOAuth1,
  oauth1Callback,
  linkAccount,
} from '../controllers/wikimediaOAuth1Controller.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

/**
 * @route   GET /api/auth/wikimedia/initiate
 * @desc    Initiate OAuth 1.0a flow - get request token and authorization URL
 * @access  Public
 */
router.get('/initiate', initiateOAuth1);

/**
 * @route   GET /api/auth/wikimedia/callback
 * @desc    Handle OAuth 1.0a callback - exchange token and create/login user
 * @access  Public
 */
router.get('/callback', oauth1Callback);

/**
 * @route   POST /api/auth/wikimedia/link
 * @desc    Link Wikimedia account to existing user
 * @access  Private (requires authentication)
 */
router.post('/link', protect, linkAccount);

export default router;




