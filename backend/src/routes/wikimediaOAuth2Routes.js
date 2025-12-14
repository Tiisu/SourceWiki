import express from 'express';
import { initiateOAuth2, oauth2Callback, linkAccount } from '../controllers/wikimediaOAuth2Controller.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

/**
 * @route   GET /api/auth/wikimedia/initiate
 * @desc    Initiate OAuth 2.0 flow - returns authorization URL
 * @access  Public
 */
router.get('/initiate', initiateOAuth2);

/**
 * @route   GET /api/auth/wikimedia/callback
 * @desc    Handle OAuth 2.0 callback from MediaWiki
 * @access  Public
 */
router.get('/callback', oauth2Callback);

/**
 * @route   POST /api/auth/wikimedia/link
 * @desc    Link Wikimedia account to existing user
 * @access  Private
 */
router.post('/link', protect, linkAccount);

export default router;


