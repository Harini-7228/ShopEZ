const PriceAlert = require('../models/PriceAlert');
const Product = require('../models/Product');

/**
 * Checks all active PriceAlert subscriptions against current prices and stock levels.
 * Simulates user notifications via console logs and marks alerts triggered.
 */
const runPriceAlertJob = async () => {
  console.log('[JOBS] Running Price Alert scan...');
  try {
    const activeAlerts = await PriceAlert.find({ active: true }).populate('productId');

    for (const alert of activeAlerts) {
      const product = alert.productId;
      if (!product) continue;

      const currentPrice = (product.discountPrice != null && product.discountPrice > 0)
        ? product.discountPrice
        : product.price;

      if (alert.type === 'price_drop') {
        if (currentPrice <= alert.targetPrice) {
          console.log(
            `[NOTIFICATION ALERT] Price Drop Triggered! User: ${alert.userId}, Product: ${product.name}, Current Price: $${currentPrice}, Target Price: $${alert.targetPrice}`
          );
          // Mark alert inactive once triggered
          alert.active = false;
          await alert.save();
        }
      } else if (alert.type === 'back_in_stock') {
        if (product.stock > 0 && product.status === 'active') {
          console.log(
            `[NOTIFICATION ALERT] Back In Stock Triggered! User: ${alert.userId}, Product: ${product.name}, Current Stock: ${product.stock}`
          );
          alert.active = false;
          await alert.save();
        }
      }
    }
    console.log('[JOBS] Price Alert scan completed.');
  } catch (error) {
    console.error('[JOBS] Error running price alert job:', error.message);
  }
};

module.exports = {
  runPriceAlertJob,
};
