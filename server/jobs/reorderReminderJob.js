const ReorderReminder = require('../models/ReorderReminder');

/**
 * Scans for due reorder alerts and logs notification warnings.
 * Automatically advances nextReminderDate for repeating items unless dismissed.
 */
const runReorderReminderJob = async () => {
  console.log('[JOBS] Running Reorder Reminder scan...');
  try {
    const currentDate = new Date();
    const dueReminders = await ReorderReminder.find({
      nextReminderDate: { $lte: currentDate },
      dismissed: false,
    }).populate('productId').populate('userId', 'name email');

    for (const reminder of dueReminders) {
      const product = reminder.productId;
      if (!product) continue;

      console.log(
        `[NOTIFICATION ALERT] Reorder Suggestion! User: ${reminder.userId?.name || reminder.userId} (${reminder.userId?.email || ''}), Product: ${product.name}, Suggested Interval: ${reminder.suggestedIntervalDays} days`
      );

      // Advance next reminder date to prevent spamming until next interval
      const nextDate = new Date();
      nextDate.setDate(nextDate.getDate() + reminder.suggestedIntervalDays);
      reminder.nextReminderDate = nextDate;
      await reminder.save();
    }
    console.log('[JOBS] Reorder Reminder scan completed.');
  } catch (error) {
    console.error('[JOBS] Error running reorder reminder job:', error.message);
  }
};

module.exports = {
  runReorderReminderJob,
};
