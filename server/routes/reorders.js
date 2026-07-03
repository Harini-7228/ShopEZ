const express = require('express');
const { body } = require('express-validator');
const { getSuggestions, dismissSnooze } = require('../controllers/reorderController');
const { protect } = require('../middlewares/auth');
const { restrictTo } = require('../middlewares/roleCheck');
const { validate } = require('../middlewares/validate');

const router = express.Router();

router.use(protect);
router.use(restrictTo('customer'));

router.get('/', getSuggestions);

router.post(
  '/:id/action',
  [
    body('action').isIn(['dismiss', 'snooze']).withMessage('Action must be: dismiss | snooze'),
    body('snoozeDays').optional().isInt({ min: 1 }).withMessage('Snooze days must be at least 1'),
    validate,
  ],
  dismissSnooze
);

module.exports = router;
