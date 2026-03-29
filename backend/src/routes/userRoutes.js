import express from 'express';
import {
  registerUser,
  getUserByEmail,
  getUserById,
  updateUserById,
  deleteUserById,
} from '../controllers/userController.js';
import {
  registerValidation,
  updateValidation,
} from '../../utils/userValidators.js';

const router = express.Router();

router.post('/register', registerValidation, registerUser);

router.get('/by-email/:email', getUserByEmail);
router.get('/:id', getUserById);
router.put('/:id', updateValidation, updateUserById);
router.delete('/:id', deleteUserById);

export default router;

