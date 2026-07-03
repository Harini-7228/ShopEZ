const express = require('express');
const { body } = require('express-validator');
const {
  subscribeAlert,
  listAlerts,
  unsubscribeAlert,
} = require('../controllers/alertController');
const { protect } = require('../middlewares/auth');
const { restrictTo } = require('../middlewares/roleCheck');
const { validate } = require('../middlewares/validate');

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

module.exports = router;
