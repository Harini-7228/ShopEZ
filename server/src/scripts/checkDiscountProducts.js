import mongoose from 'mongoose';
import Product from '../models/Product.js';
import config from '../config/env.js';

async function run() {
  try {
    await mongoose.connect(config.mongoUri);
    console.log('Connected to DB');

    const total = await Product.countDocuments();
    const withDiscount = await Product.countDocuments({ discountPrice: { $exists: true, $gt: 0 } });
    console.log('Total products:', total);
    console.log('Products with discount:', withDiscount);

    const products = await Product.find().limit(5).select('name price discountPrice views isLocalListing');
    console.log('Sample products:', JSON.stringify(products, null, 2));

  } catch (error) {
    console.error(error);
  } finally {
    await mongoose.connection.close();
  }
}

run();
