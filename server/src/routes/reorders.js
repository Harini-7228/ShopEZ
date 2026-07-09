import express from 'express';
import { body } from 'express-validator';
import { getSuggestions, dismissSnooze } from '../controllers/reorderController.js';
import { protect } from '../middleware/auth.js';
import { restrictTo } from '../middleware/roleCheck.js';
import { validate } from '../middleware/validate.js';

const router = express.Router();

router.use(protect);
router.use(restrictTo('customer'));

router.get('/', getSuggestions);

router.post(
  '/:id/action',
  [
    body('action').isIn(['dismiss', 'snooze']).withMessage('Action must be: dismiss | snooze'),
    body('snoozeDays').optional().isInt({ min: 1, max: 365 }).withMessage('Snooze days must be between 1 and 365'),
    validate,
  ],
  dismissSnooze
);

export default router;
