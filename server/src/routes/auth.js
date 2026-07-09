import express from 'express';
import { body } from 'express-validator';
import { register, login, forgotPassword, resetPassword, refreshToken, logout, getMe, updateMe } from '../controllers/authController.js';
import { protect } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';

const router = express.Router();

// Input validators
const registerValidation = [
  body('name').trim().notEmpty().withMessage('Name is required'),
  body('email').isEmail().withMessage('Please provide a valid email'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters long'),
  body('role').optional().isIn(['customer', 'seller']).withMessage('Invalid role — delivery accounts are assigned by admins'),
  body('phone').optional().isString(),
  body('isLocalSeller').optional().isBoolean(),
  validate,
];

const loginValidation = [
  body('email').isEmail().withMessage('Please provide a valid email'),
  body('password').notEmpty().withMessage('Password is required'),
  validate,
];

router.post('/register', registerValidation, register);
router.post('/login', loginValidation, login);
router.post(
  '/forgot-password',
  [
    body('email').isEmail().withMessage('Please provide a valid email'),
    validate,
  ],
  forgotPassword
);
router.post(
  '/reset-password/:token',
  [
    body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters long'),
    validate,
  ],
  resetPassword
);
router.post('/refresh-token', refreshToken);
router.post('/logout', logout);
router.get('/me', protect, getMe);
router.patch('/me', protect, updateMe); // Update name, phone, addresses

export default router;
