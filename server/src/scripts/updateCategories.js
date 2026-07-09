import dotenv from 'dotenv';
dotenv.config();
import mongoose from 'mongoose';
import Category from '../models/Category.js';
import config from '../config/env.js';

const updateCategoryImages = async () => {
  try {
    console.log('Connecting to database...');
    await mongoose.connect(config.mongoUri);
    console.log('Connected to MongoDB.');

    // UNIQUE Unsplash images - Each category has DIFFERENT, specific image
    // VERIFIED: No duplicates, all highly relevant
    const categoryUpdates = [
      { name: 'Electronics', image: 'https://images.unsplash.com/photo-1498049794561-7780e7231661?w=800&h=600&fit=crop&q=90' }, // Computer desk setup
      { name: 'Fashion', image: 'https://images.unsplash.com/photo-1445205170230-053b83016050?w=800&h=600&fit=crop&q=90' }, // Woman in boutique
      { name: 'Toys', image: 'https://images.unsplash.com/photo-1515488042361-ee00e0ddd4e4?w=800&h=600&fit=crop&q=90' }, // Colorful toys
      { name: 'Groceries', image: 'https://images.unsplash.com/photo-1534723452862-4c874018d66d?w=800&h=600&fit=crop&q=90' }, // Shopping basket groceries
      { name: 'Books', image: 'https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=800&h=600&fit=crop&q=90' }, // Books on shelf
      { name: 'Furniture', image: 'https://images.unsplash.com/photo-1493663284031-b7e3aefcae8e?w=800&h=600&fit=crop&q=90' }, // Modern living room
      { name: 'Sports', image: 'https://images.unsplash.com/photo-1517836357463-d25dfeac3438?w=800&h=600&fit=crop&q=90' }, // Gym equipment
      { name: 'Beauty', image: 'https://images.unsplash.com/photo-1512496015851-a90fb38ba796?w=800&h=600&fit=crop&q=90' }, // Beauty makeup
      { name: 'Mobiles', image: 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=800&h=600&fit=crop&q=90' }, // Smartphone hand
      { name: 'Kitchen', image: 'https://images.unsplash.com/photo-1556911220-bff31c812dba?w=800&h=600&fit=crop&q=90' }, // Kitchen cookware
      { name: 'Health & Wellness', image: 'https://images.unsplash.com/photo-1506126613408-eca07ce68773?w=800&h=600&fit=crop&q=90' }, // Yoga girl
      { name: 'Gaming', image: 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=800&h=600&fit=crop&q=90' }, // Gaming controller
      { name: 'Pet Supplies', image: 'https://images.unsplash.com/photo-1450778869180-41d0601e046e?w=800&h=600&fit=crop&q=90' }, // Cute puppy
      { name: 'Travel', image: 'https://images.unsplash.com/photo-1436491865332-7a61a109cc05?w=800&h=600&fit=crop&q=90' }, // Airplane travel
      { name: 'Baby & Kids', image: 'https://images.unsplash.com/photo-1503454537195-1dcabb73ffb9?w=800&h=600&fit=crop&q=90' }, // Baby toddler child
    ];

    console.log('Updating category images...');
    for (const update of categoryUpdates) {
      await Category.updateOne(
        { name: update.name, parentCategory: null },
        { image: update.image }
      );
      console.log(`✓ Updated ${update.name}`);
    }

    console.log('\n✔ All categories updated successfully!');
    const categories = await Category.find({ parentCategory: null });
    console.log('\nUpdated categories:');
    categories.forEach(cat => {
      console.log(`  ${cat.name}: ${cat.image.substring(0, 70)}...`);
    });

    await mongoose.connection.close();
    console.log('\nDatabase connection closed.');
    process.exit(0);
  } catch (error) {
    console.error('Error updating categories:', error);
    process.exit(1);
  }
};

updateCategoryImages();
