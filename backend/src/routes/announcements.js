import express from 'express';
import { listAnnouncements } from '../controllers/announcementsController.js';

const router = express.Router();

router.get('/', listAnnouncements);

export default router;
