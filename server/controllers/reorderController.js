const ReorderReminder = require('../models/ReorderReminder');
const { sendSuccess } = require('../utils/apiResponse');
const asyncHandler = require('../utils/asyncHandler');

/**
 * @desc Get my reorder suggestions
 * @route GET /api/v1/reorders
 * @access Private
 */
const getSuggestions = asyncHandler(async (req, res, next) => {
  const currentDate = new Date();

  // Find due reminders that haven't been dismissed
  const suggestions = await ReorderReminder.find({
    userId: req.user._id,
    nextReminderDate: { $lte: currentDate },
    dismissed: false,
  }).populate('productId', 'name price discountPrice images stock status');

  sendSuccess(res, suggestions, 'Reorder reminders retrieved successfully');
});

/**
 * @desc Dismiss or snooze a reorder suggestion
 * @route POST /api/v1/reorders/:id/action
 * @access Private
 */
const dismissSnooze = asyncHandler(async (req, res, next) => {
  const { action, snoozeDays = 7 } = req.body; // action: 'dismiss' or 'snooze'
  const reminderId = req.params.id;

  const reminder = await ReorderReminder.findById(reminderId);

  if (!reminder) {
    return res.status(404).json({
      success: false,
      message: 'Reorder suggestion not found',
      data: null,
    });
  }

  // Auth check
  if (reminder.userId.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
    return res.status(403).json({
      success: false,
      message: 'Not authorized to perform action on this reminder',
      data: null,
    });
  }

  if (action === 'dismiss') {
    reminder.dismissed = true;
    await reminder.save();
    return sendSuccess(res, reminder, 'Reorder reminder dismissed successfully');
  }

  if (action === 'snooze') {
    const newReminderDate = new Date();
    newReminderDate.setDate(newReminderDate.getDate() + parseInt(snoozeDays, 10));

    reminder.nextReminderDate = newReminderDate;
    reminder.dismissed = false; // reset in case it was dismissed
    await reminder.save();

    return sendSuccess(res, reminder, `Reorder reminder successfully snoozed for ${snoozeDays} days`);
  }

  return res.status(400).json({
    success: false,
    message: 'Invalid action provided. Must be: dismiss | snooze',
    data: null,
  });
});

module.exports = {
  getSuggestions,
  dismissSnooze,
};
