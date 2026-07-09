import PriceAlert from '../models/PriceAlert.js';
import Product from '../models/Product.js';

/**
 * Checks all active PriceAlert subscriptions against current prices/stock.
 */
const runPriceAlertJob = async () => {
  console.log('[JOBS] Running Price Alert scan...');
  try {
    // 1. Load all active alerts — lean() skips Mongoose document overhead
    const activeAlerts = await PriceAlert.find({ active: true }).lean();
    if (activeAlerts.length === 0) {
      console.log('[JOBS] No active alerts. Skipping.');
      return;
    }

    // 2. Batch-fetch all relevant products in one query
    const productIds = [...new Set(activeAlerts.map((a) => String(a.productId)))];
    const products = await Product.find({ _id: { $in: productIds } })
      .select('name price discountPrice stock status')
      .lean();
    const productMap = new Map(products.map((p) => [String(p._id), p]));

    // 3. Evaluate each alert — collect IDs to deactivate
    const triggeredIds = [];

    for (const alert of activeAlerts) {
      const product = productMap.get(String(alert.productId));
      if (!product) continue;

      const currentPrice =
        product.discountPrice != null && product.discountPrice > 0
          ? product.discountPrice
          : product.price;

      if (alert.type === 'price_drop' && currentPrice <= alert.targetPrice) {
        console.log(
          `[ALERT] Price Drop — User: ${alert.userId}, Product: ${product.name}, ` +
            `Current: ₹${currentPrice}, Target: ₹${alert.targetPrice}`
        );
        triggeredIds.push(alert._id);
      } else if (
        alert.type === 'back_in_stock' &&
        product.stock > 0 &&
        product.status === 'active'
      ) {
        console.log(
          `[ALERT] Back In Stock — User: ${alert.userId}, Product: ${product.name}, ` +
            `Stock: ${product.stock}`
        );
        triggeredIds.push(alert._id);
      }
    }

    // 4. Single bulk deactivation write instead of N individual saves
    if (triggeredIds.length > 0) {
      await PriceAlert.updateMany(
        { _id: { $in: triggeredIds } },
        { $set: { active: false } }
      );
      console.log(`[JOBS] Deactivated ${triggeredIds.length} triggered alert(s).`);
    }

    console.log('[JOBS] Price Alert scan completed.');
  } catch (error) {
    console.error('[JOBS] Error running price alert job:', error.message);
  }
};

export { runPriceAlertJob };
