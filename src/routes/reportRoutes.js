import express from 'express';
import {
  createReport,
  getReports,
  getReport,
  updateReport,
  deleteReport,
  addPublicComment,
  addAdminComment,
  upvoteReport,
  getUserReports
} from '../controllers/reportController.js';
import { protect, authorize } from '../middleware/authMiddleware.js';
import multer from 'multer';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const router = express.Router();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const uploadsDir = path.join(__dirname, '../../uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname);
    cb(null, file.fieldname + '-' + uniqueSuffix + ext);
  }
});

const fileFilter = (req, file, cb) => {
  if (file.mimetype.startsWith('image/')) {
    cb(null, true);
  } else {
    cb(new Error('Only image files are allowed'), false);
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 }
});

router.get('/', getReports);
router.get('/user-reports', protect, getUserReports);
router.get('/:id', getReport);

router.post('/', protect, upload.array('images', 5), createReport);
router.put('/:id', protect, upload.array('images', 5), updateReport);
router.delete('/:id', protect, deleteReport);
router.post('/:id/public-comments', protect, addPublicComment);
router.post('/:id/admin-comments', protect, authorize('admin'), addAdminComment);
router.put('/:id/upvote', protect, upvoteReport);

export default router;