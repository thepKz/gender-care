import express from 'express';
import {
  connectGoogle,
  googleAuthCallback,
  getConnectionStatus,
  disconnectGoogle,
  testCreateMeet
} from '../controllers/googleAuthController';

const router = express.Router();

/**
 * Google Authentication Routes
 */

// GET /api/google-auth/connect/:doctorId - Generate OAuth URL
router.get('/connect/:doctorId', connectGoogle);

// GET /api/google-auth/callback - Handle OAuth callback từ Google
router.get('/callback', googleAuthCallback);

// GET /api/google-auth/status/:doctorId - Check connection status
router.get('/status/:doctorId', getConnectionStatus);

// POST /api/google-auth/disconnect/:doctorId - Disconnect Google account
router.post('/disconnect/:doctorId', disconnectGoogle);

// GET /api/google-auth/test-meet/:doctorId - Test Google Meet creation (development only)
router.post('/test-meet/:doctorId', testCreateMeet);

export default router; 