import express from 'express';
import { authUser, registerUser, verifyFace, saveFace, getUserProfile } from '../controllers/userController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.post('/register', registerUser);
router.post('/login', authUser);
router.post('/verify-face', protect, verifyFace);
router.post('/save-face', protect, saveFace);
router.get('/profile', protect, getUserProfile);

export default router;
