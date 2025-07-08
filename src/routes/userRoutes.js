import express from 'express';
import {
  registerUser,
  loginUser,
  getMe,
  updateProfile,
  updatePassword,
  logout
} from '../controllers/authController.js';
import {
  getUsers,
  verifyUser,
  updateUserRole,
  deleteUser
} from '../controllers/adminController.js';
import { protect, authorize } from '../middleware/authMiddleware.js';
import upload from '../middleware/uploadMiddleware.js';

const router = express.Router();

router.post('/register', registerUser);
router.post('/login', loginUser);

router.get('/me', protect, getMe);
router.put('/me', protect, upload.single('avatar'), updateProfile);
router.put('/password', protect, updatePassword);
router.get('/logout', protect, logout);

router.get('/admin', protect, authorize('admin'), getUsers);
router.put('/admin/:id/verify', protect, authorize('admin'), verifyUser);
router.put('/admin/:id/role', protect, authorize('admin'), updateUserRole);
router.delete('/admin/:id', protect, authorize('admin'), deleteUser);

export default router;