import express from 'express';
import {
  getAllNotices,
  getNoticeById,
  createNotice,
  updateNotice,
  deleteNotice,
  deactivateNotice
} from '../controllers/noticeController.js';

const router = express.Router();

// GET all notices - /api/notices?isActive=true&priority=high&type=info
router.get('/', getAllNotices);

// GET single notice by ID - /api/notices/:id
router.get('/:id', getNoticeById);

// POST create new notice - /api/notices
router.post('/', createNotice);

// PUT update notice - /api/notices/:id
router.put('/:id', updateNotice);

// DELETE notice permanently - /api/notices/:id
router.delete('/:id', deleteNotice);

// PATCH deactivate notice (soft delete) - /api/notices/:id/deactivate
router.patch('/:id/deactivate', deactivateNotice);

export default router;
