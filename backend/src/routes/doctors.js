import express from 'express';
import { listDoctors, getDoctor } from '../controllers/doctorsController.js';

const router = express.Router();

router.get('/', listDoctors);
router.get('/:id', getDoctor);

export default router;
