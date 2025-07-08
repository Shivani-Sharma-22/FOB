import express from 'express';
import {
  createReward,
  getRewards,
  getReward,
  updateReward,
  deleteReward,
  redeemReward,
  getMyRewards
} from '../controllers/rewardController.js';
import { protect, authorize } from '../middleware/authMiddleware.js';
import upload from '../middleware/uploadMiddleware.js';

const router = express.Router();

router.get('/', getRewards);
router.get('/:id', getReward);

router.get('/user/my-rewards', protect, getMyRewards);
router.post('/', protect, authorize('admin'), createReward);
router.put('/:id', protect, authorize('admin'), updateReward);
router.delete('/:id', protect, authorize('admin'), deleteReward);
router.post('/:id/redeem', protect, redeemReward);

export default router;