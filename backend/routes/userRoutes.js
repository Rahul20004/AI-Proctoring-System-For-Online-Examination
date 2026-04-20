import express from 'express';
import { authUser, registerUser, verifyFace, saveFace, saveFaceDescriptor, getUserProfile } from '../controllers/userController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.post('/register', registerUser);
router.post('/login', authUser);
router.post('/verify-face', protect, verifyFace);
router.post('/save-face', protect, saveFace);
router.post('/save-face-descriptor', protect, saveFaceDescriptor);
router.get('/profile', protect, getUserProfile);

export default router;
