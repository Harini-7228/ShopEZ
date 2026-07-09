import express from 'express';
import { body } from 'express-validator';
import { subscribeAlert, listAlerts, unsubscribeAlert, } from '../controllers/alertController.js';
import { protect } from '../middleware/auth.js';
import { restrictTo } from '../middleware/roleCheck.js';
import { validate } from '../middleware/validate.js';

const router = express.Router();

router.use(protect);
router.use(restrictTo('customer'));

router.get('/', listAlerts);

router.post(
  '/subscribe',
  [
    body('productId').isMongoId().withMessage('Product ID must be a valid Mongo ID'),
    body('type').isIn(['price_drop', 'back_in_stock']).withMessage('Alert type must be: price_drop | back_in_stock'),
    body('targetPrice').optional().isNumeric().withMessage('Target price must be a valid number'),
    validate,
  ],
  subscribeAlert
);

router.delete('/:id', unsubscribeAlert);

export default router;
