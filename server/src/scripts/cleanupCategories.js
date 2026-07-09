import dotenv from 'dotenv';
dotenv.config();
import mongoose from 'mongoose';
import Category from '../models/Category.js';
import config from '../config/env.js';

const cleanupCategories = async () => {
  try {
    console.log('Connecting to database...');
    await mongoose.connect(config.mongoUri);
    console.log('Connected to MongoDB.');

    // List all top-level categories
    const allCategories = await Category.find({ parentCategory: null });
    console.log('\nAll top-level categories in database:');
    allCategories.forEach(cat => {
      console.log(`  - ${cat.name}`);
    });

    // Define the correct 15 categories
    const correctCategories = [
      'Electronics', 'Fashion', 'Toys', 'Groceries', 'Books',
      'Furniture', 'Sports', 'Beauty', 'Mobiles', 'Kitchen',
      'Health & Wellness', 'Gaming', 'Pet Supplies', 'Travel', 'Baby & Kids'
    ];

    // Find and delete categories that are NOT in the correct list
    const toDelete = allCategories.filter(cat => !correctCategories.includes(cat.name));
    
    if (toDelete.length > 0) {
      console.log('\n⚠️  Found old/extra categories to delete:');
      toDelete.forEach(cat => console.log(`  - ${cat.name}`));
      
      for (const cat of toDelete) {
        await Category.deleteOne({ _id: cat._id });
        console.log(`✓ Deleted: ${cat.name}`);
      }
      console.log('\n✔ Cleanup complete!');
    } else {
      console.log('\n✔ No extra categories found. Database is clean!');
    }

    await mongoose.connection.close();
    console.log('\nDatabase connection closed.');
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
};

cleanupCategories();
