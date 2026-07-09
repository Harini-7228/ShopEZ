import dotenv from 'dotenv';
dotenv.config();
import mongoose from 'mongoose';
import Product from '../models/Product.js';
import config from '../config/env.js';

const updates = [
  {
    name: 'Ergonomic Mesh Office Chair',
    image: 'https://images.unsplash.com/photo-1580481072645-022f9a6dbf27?w=600&auto=format&fit=crop&q=80'
  },
  {
    name: 'Scandinavian Bookshelf 5-Tier',
    image: 'https://images.unsplash.com/photo-1594620302200-9a762244a156?w=600&auto=format&fit=crop&q=80'
  },
  {
    name: 'Smart UV Sterilizing Water Bottle',
    image: 'https://images.unsplash.com/photo-1602143407151-7111542de6e8?w=600&auto=format&fit=crop&q=80'
  },
  {
    name: 'Premium Dry Dog Food — Chicken & Rice 3kg',
    image: 'https://images.unsplash.com/photo-1589924691995-400dc9ecc119?w=600&auto=format&fit=crop&q=80'
  },
  {
    name: 'Organic Cotton Baby Bodysuit Set (5-pack)',
    image: 'https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?w=600&auto=format&fit=crop&q=80'
  },
  {
    name: 'Smart Football',
    image: 'https://images.unsplash.com/photo-1518063319789-7217e6706b04?w=600&auto=format&fit=crop&q=80'
  },
  {
    name: 'Leather Oxford Dress Shoes',
    image: 'https://images.unsplash.com/photo-1614252235316-8c857d38b5f4?w=600&auto=format&fit=crop&q=80'
  },
  {
    name: 'Hardshell Cabin Trolley Bag 55cm',
    image: 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=600&auto=format&fit=crop&q=80'
  },
  {
    name: 'Pro Running Shoes',
    image: 'https://images.unsplash.com/photo-1595950653106-6c9ebd614d3a?w=600&auto=format&fit=crop&q=80'
  },
  {
    name: 'Noise Cancelling Wireless Headphones',
    image: 'https://images.unsplash.com/photo-1546435770-a3e426bf472b?w=600&auto=format&fit=crop&q=80'
  }
];

const run = async () => {
  try {
    console.log('Connecting to database...');
    await mongoose.connect(config.mongoUri);
    console.log('Connected to MongoDB.');

    for (const item of updates) {
      const res = await Product.updateOne(
        { name: item.name },
        { $set: { images: [item.image] } }
      );
      if (res.modifiedCount > 0) {
        console.log(`Updated images for: ${item.name}`);
      } else {
        console.log(`No changes made for: ${item.name} (either not found or already matches)`);
      }
    }

    console.log('Database product image updates completed.');
    process.exit(0);
  } catch (error) {
    console.error('Error running script:', error);
    process.exit(1);
  }
};

run();
