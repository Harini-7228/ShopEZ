import ReorderReminder from '../models/ReorderReminder.js';

/**
 * Scans for due reorder alerts and advances their next reminder date.
 */
const runReorderReminderJob = async () => {
  console.log('[JOBS] Running Reorder Reminder scan...');
  try {
    const currentDate = new Date();

    // lean() — we only need plain objects for logging + building bulk ops
    const dueReminders = await ReorderReminder.find({
      nextReminderDate: { $lte: currentDate },
      dismissed: false,
    })
      .populate('productId', 'name')
      .populate('userId', 'name email')
      .lean();

    if (dueReminders.length === 0) {
      console.log('[JOBS] No due reminders. Skipping.');
      return;
    }

    // Build bulk update ops — one write per reminder to advance the date
    const bulkOps = dueReminders.map((reminder) => {
      const product = reminder.productId;

      if (product) {
        console.log(
          `[ALERT] Reorder — User: ${reminder.userId?.name || reminder.userId} ` +
            `(${reminder.userId?.email || ''}), Product: ${product.name}, ` +
            `Interval: ${reminder.suggestedIntervalDays} days`
        );
      }

      const nextDate = new Date();
      nextDate.setDate(nextDate.getDate() + reminder.suggestedIntervalDays);

      return {
        updateOne: {
          filter: { _id: reminder._id },
          update: { $set: { nextReminderDate: nextDate } },
        },
      };
    });

    // Single DB round-trip instead of N saves
    await ReorderReminder.bulkWrite(bulkOps, { ordered: false });

    console.log(`[JOBS] Reorder Reminder scan completed. Processed ${dueReminders.length} reminder(s).`);
  } catch (error) {
    console.error('[JOBS] Error running reorder reminder job:', error.message);
  }
};

export { runReorderReminderJob };
