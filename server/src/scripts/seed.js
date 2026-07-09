import dotenv from 'dotenv';
dotenv.config();
import mongoose from 'mongoose';
import User from '../models/User.js';
import Category from '../models/Category.js';
import Product from '../models/Product.js';
import config from '../config/env.js';

const seedDB = async () => {
  try {
    console.log('Connecting to database for seeding...');
    await mongoose.connect(config.mongoUri);
    console.log('Connected to MongoDB.');

    console.log('Clearing existing Collections...');
    await User.deleteMany({});
    await Category.deleteMany({});
    await Product.deleteMany({});
    console.log('Collections cleared.');

    // ─── 1. CREATE USERS ───────────────────────────────────────────────
    console.log('Creating default users...');

    const seller = await User.create({
      name: 'Alpha Merchant Store',
      email: 'seller@shopez.com',
      passwordHash: '123456',
      role: 'seller',
      phone: '9876543210',
      isLocalSeller: true,
      sellerImpactScore: 88,
      addresses: [{ street: '102 Commercial St', city: 'Bangalore', state: 'Karnataka', zip: '560001', country: 'India' }]
    });

    await User.create({
      name: 'Rohan Sharma',
      email: 'customer@shopez.com',
      passwordHash: '123456',
      role: 'customer',
      phone: '9876543211',
      addresses: [{ street: '45 Lotus Lane', city: 'Mumbai', state: 'Maharashtra', zip: '400001', country: 'India' }]
    });

    await User.create({ name: 'Super Admin', email: 'admin@shopez.com', passwordHash: '123456', role: 'admin', phone: '9876543212' });
    await User.create({ name: 'Ramesh Express', email: 'delivery@shopez.com', passwordHash: '123456', role: 'delivery', phone: '9876543213' });

    console.log('✔ Users created');

    // ─── 2. CREATE CATEGORIES ──────────────────────────────────────────
    console.log('Creating categories...');
    const catElectronics = await Category.create({ name: 'Electronics', image: 'https://images.unsplash.com/photo-1498049794561-7780e7231661?w=800&h=600&fit=crop&q=90' });
    const catFashion     = await Category.create({ name: 'Fashion', image: 'https://images.unsplash.com/photo-1445205170230-053b83016050?w=800&h=600&fit=crop&q=90' });
    const catToys        = await Category.create({ name: 'Toys', image: 'https://images.unsplash.com/photo-1515488042361-ee00e0ddd4e4?w=800&h=600&fit=crop&q=90' });
    const catGroceries   = await Category.create({ name: 'Groceries', image: 'https://images.unsplash.com/photo-1534723452862-4c874018d66d?w=800&h=600&fit=crop&q=90' });
    const catBooks       = await Category.create({ name: 'Books', image: 'https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=800&h=600&fit=crop&q=90' });
    const catFurniture   = await Category.create({ name: 'Furniture', image: 'https://images.unsplash.com/photo-1493663284031-b7e3aefcae8e?w=800&h=600&fit=crop&q=90' });
    const catSports      = await Category.create({ name: 'Sports', image: 'https://images.unsplash.com/photo-1517836357463-d25dfeac3438?w=800&h=600&fit=crop&q=90' });
    const catBeauty      = await Category.create({ name: 'Beauty', image: 'https://images.unsplash.com/photo-1512496015851-a90fb38ba796?w=800&h=600&fit=crop&q=90' });
    const catMobiles     = await Category.create({ name: 'Mobiles', image: 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=800&h=600&fit=crop&q=90' });
    const catKitchen     = await Category.create({ name: 'Kitchen', image: 'https://images.unsplash.com/photo-1556911220-bff31c812dba?w=800&h=600&fit=crop&q=90' });
    const catHealth      = await Category.create({ name: 'Health & Wellness', image: 'https://images.unsplash.com/photo-1506126613408-eca07ce68773?w=800&h=600&fit=crop&q=90' });
    const catGaming      = await Category.create({ name: 'Gaming', image: 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=800&h=600&fit=crop&q=90' });
    const catPets        = await Category.create({ name: 'Pet Supplies', image: 'https://images.unsplash.com/photo-1450778869180-41d0601e046e?w=800&h=600&fit=crop&q=90' });
    const catTravel      = await Category.create({ name: 'Travel', image: 'https://images.unsplash.com/photo-1436491865332-7a61a109cc05?w=800&h=600&fit=crop&q=90' });
    const catBaby        = await Category.create({ name: 'Baby & Kids', image: 'https://images.unsplash.com/photo-1503454537195-1dcabb73ffb9?w=800&h=600&fit=crop&q=90' });

    console.log('Creating subcategories...');
    // Subcategories for Fashion
    const catFashionMen = await Category.create({ name: "Men's Wear", parentCategory: catFashion._id });
    const catFashionWomen = await Category.create({ name: "Women's Wear", parentCategory: catFashion._id });
    const catFashionKids = await Category.create({ name: "Kids Wear", parentCategory: catFashion._id });

    // Subcategories for Electronics
    const catElecAudio = await Category.create({ name: "Audio", parentCategory: catElectronics._id });
    const catElecWearables = await Category.create({ name: "Wearables", parentCategory: catElectronics._id });
    const catElecComputers = await Category.create({ name: "Computers", parentCategory: catElectronics._id });

    // Subcategories for Toys
    const catToysAction = await Category.create({ name: "Action Figures", parentCategory: catToys._id });
    const catToysEdu = await Category.create({ name: "Educational", parentCategory: catToys._id });

    console.log('✔ Categories created');

    // ─── 3. CREATE PRODUCTS ────────────────────────────────────────────
    console.log('Creating products...');

    const products = [

      // ── ELECTRONICS ──────────────────────────────────────────────────
      {
        name: 'Noise Cancelling Wireless Headphones',
        description: 'Immersive sound with active hybrid noise cancellation. 40 hours of playtime, foldable design with a carrying case.',
        price: 8999, discountPrice: 6999,
        category: catElecAudio._id, sellerId: seller._id, stock: 12, sku: 'ELEC-HDPHN-01', status: 'active',
        images: ['https://images.unsplash.com/photo-1546435770-a3e426bf472b?w=600&auto=format&fit=crop&q=80'],
        specifications: { 'Color': 'Black', 'Brand': 'Sonic', 'Battery Life': '40 Hours', 'Driver Size': '40mm', 'Bluetooth': '5.2', 'NFC Pairing': 'Yes' }
      },
      {
        name: 'Sleek Smart Fitness Tracker',
        description: 'Track steps, heart rate, SpO2, and sleep. AMOLED touch display with 7-day battery and IP68 water resistance.',
        price: 4999, discountPrice: 3299,
        category: catElecWearables._id, sellerId: seller._id, stock: 25, sku: 'ELEC-FITTRK-02', status: 'active',
        images: ['https://images.unsplash.com/photo-1575311373937-040b8e1fd5b6?w=600&auto=format&fit=crop&q=80'],
        specifications: { 'Color': 'Black', 'Brand': 'FitPro', 'Screen': '1.4" AMOLED', 'Water Resistance': 'IP68', 'Battery': '7 Days', 'Sensors': 'HR, SpO2, Gyro' }
      },
      {
        name: 'Mechanical Backlit Gaming Keyboard',
        description: 'Tenkeyless RGB keyboard with tactile brown switches, double-shot PBT keycaps and aluminium top plate.',
        price: 6999, discountPrice: 5499,
        category: catElecComputers._id, sellerId: seller._id, stock: 10, sku: 'ELEC-KEYBD-03', status: 'active',
        images: ['https://images.unsplash.com/photo-1587829741301-dc798b83add3?w=600&auto=format&fit=crop&q=80'],
        specifications: { 'Color': 'Silver', 'Brand': 'Keychron', 'Switches': 'Tactile Brown', 'Layout': 'TKL 80%', 'Backlight': '16.8M RGB', 'Polling Rate': '1000Hz' }
      },
      {
        name: 'True Wireless Earbuds Pro',
        description: 'Premium TWS earbuds with 6mm dynamic drivers, 30 hrs total battery, IPX5 splash proof and touch controls.',
        price: 3499, discountPrice: 2799,
        category: catElecAudio._id, sellerId: seller._id, stock: 30, sku: 'ELEC-TWS-04', status: 'active',
        images: ['https://images.unsplash.com/photo-1590658268037-6bf12165a8df?w=600&auto=format&fit=crop&q=80'],
        specifications: { 'Color': 'White', 'Brand': 'Sonic', 'Driver': '6mm Dynamic', 'Battery Total': '30 Hrs', 'Charging': 'USB-C Fast Charge', 'Resistance': 'IPX5' }
      },
      {
        name: '27" 4K HDR Monitor',
        description: 'Ultra-sharp IPS panel, 4K UHD resolution, 144Hz refresh rate, HDR400, with USB-C 65W charging port.',
        price: 34999, discountPrice: 28999,
        category: catElecComputers._id, sellerId: seller._id, stock: 7, sku: 'ELEC-MON-05', status: 'active',
        images: ['https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?w=600&auto=format&fit=crop&q=80'],
        specifications: { 'Color': 'Black', 'Brand': 'ViewMaster', 'Resolution': '4K UHD 3840×2160', 'Refresh': '144Hz', 'Panel': 'IPS', 'HDR': 'DisplayHDR 400' }
      },

      // ── MOBILES ───────────────────────────────────────────────────────
      {
        name: 'ProMax Smartphone 256GB',
        description: 'Flagship Android phone — 6.7" AMOLED 120Hz display, 50MP triple camera, Dimensity 9200 chip and 5000mAh battery.',
        price: 54999, discountPrice: 47999,
        category: catMobiles._id, sellerId: seller._id, stock: 18, sku: 'MOB-PROMAX-01', status: 'active',
        images: ['https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=600&auto=format&fit=crop&q=80'],
        specifications: { 'Display': '6.7" AMOLED 120Hz', 'Camera': '50+12+10 MP', 'RAM': '12GB', 'Storage': '256GB', 'Battery': '5000mAh 67W' }
      },
      {
        name: 'Budget 5G Smartphone 128GB',
        description: 'Affordable 5G experience with a 6.5" LCD display, quad-camera setup and 33W fast charging.',
        price: 16999, discountPrice: 13499,
        category: catMobiles._id, sellerId: seller._id, stock: 40, sku: 'MOB-BUDGET-02', status: 'active',
        images: ['https://images.unsplash.com/photo-1601784551446-20c9e07cdbdb?w=600&auto=format&fit=crop&q=80'],
        specifications: { 'Network': '5G SA/NSA', 'Display': '6.5" IPS LCD', 'RAM': '6GB', 'Storage': '128GB + MicroSD', 'Battery': '5000mAh', 'Charging': '33W' }
      },
      {
        name: 'Wireless Fast Charger Pad',
        description: '15W MagSafe compatible wireless charging pad with intelligent heat management and LED indicator ring.',
        price: 1799, discountPrice: 1299,
        category: catMobiles._id, sellerId: seller._id, stock: 55, sku: 'MOB-CHRG-03', status: 'active',
        images: ['https://images.unsplash.com/photo-1616440347437-b1c73416efc2?w=600&auto=format&fit=crop&q=80'],
        specifications: { 'Output': '15W Max', 'Compatible': 'Qi / MagSafe', 'Safety': 'OVP, OCP, OTP', 'Indicator': 'LED Ring' }
      },
 
      // ── FASHION ───────────────────────────────────────────────────────
      {
        name: 'Classic Indigo Denim Jacket',
        description: 'Heavy-duty 100% organic denim jacket with metal button trims. Timeless streetwear staple for all seasons.',
        price: 2999, discountPrice: 2199,
        category: catFashionMen._id, sellerId: seller._id, stock: 15, sku: 'FASH-DNMJKT-01', status: 'active',
        images: ['https://images.unsplash.com/photo-1576995853123-5a10305d93c0?w=600&auto=format&fit=crop&q=80'],
        specifications: { 'Color': 'Blue', 'Style': 'Casual', 'Material': '100% Organic Denim', 'Sizes': 'XS–3XL', 'Care': 'Machine Wash Cold', 'Fit': 'Regular' }
      },
      {
        name: 'Organic Cotton Oversized Hoodie',
        description: 'Breathable 240 GSM hoodie made from long-staple organic cotton. Kangaroo pockets and ribbed cuffs.',
        price: 2499, discountPrice: 1799,
        category: catFashionMen._id, sellerId: seller._id, stock: 22, sku: 'FASH-HOODIE-02', status: 'active',
        images: ['https://images.unsplash.com/photo-1556821840-3a63f95609a7?w=600&auto=format&fit=crop&q=80'],
        specifications: { 'Color': 'Grey', 'Style': 'Casual', 'Fabric': '240 GSM Organic Cotton', 'Sizes': 'S–XXL', 'Fit': 'Oversized', 'Pockets': 'Kangaroo + Side', 'Wash': 'Cold Wash' }
      },
      {
        name: 'Leather Oxford Dress Shoes',
        description: 'Full-grain calfskin leather oxfords with Goodyear welt construction. Rubber sole for all-weather traction.',
        price: 5499, discountPrice: 4299,
        category: catFashionMen._id, sellerId: seller._id, stock: 14, sku: 'FASH-OXFORD-03', status: 'active',
        images: ['https://images.unsplash.com/photo-1614252235316-8c857d38b5f4?w=600&auto=format&fit=crop&q=80'],
        specifications: { 'Color': 'Brown', 'Style': 'Formal', 'Upper': 'Full-Grain Calfskin', 'Construction': 'Goodyear Welt', 'Sizes': 'UK 7–11', 'Sole': 'Rubber', 'Lining': 'Leather' }
      },
      {
        name: 'Floral Maxi Summer Dress',
        description: 'Airy rayon maxi dress with bold floral print, adjustable straps, and side pockets. Perfect for vacations.',
        price: 1799, discountPrice: 1299,
        category: catFashionWomen._id, sellerId: seller._id, stock: 28, sku: 'FASH-DRESS-04', status: 'active',
        images: ['https://images.unsplash.com/photo-1515372039744-b8f02a3ae446?w=600&auto=format&fit=crop&q=80'],
        specifications: { 'Color': 'Multicolor', 'Style': 'Casual', 'Fabric': '100% Rayon', 'Pockets': 'Yes', 'Sizes': 'XS–2XL', 'Pattern': 'Floral Print' }
      },
      {
        name: 'Premium Merino Wool Scarf',
        description: 'Ultra-soft 100% merino wool scarf. Naturally temperature-regulating and odour-resistant. 190cm length.',
        price: 1499, discountPrice: 999,
        category: catFashionWomen._id, sellerId: seller._id, stock: 35, sku: 'FASH-SCARF-05', status: 'active',
        images: ['https://images.unsplash.com/photo-1520903920243-00d872a2d1c9?w=600&auto=format&fit=crop&q=80'],
        specifications: { 'Color': 'Pink', 'Style': 'Ethnic Wear', 'Material': '100% Merino Wool', 'Size': '190×30 cm', 'Weight': '220 GSM', 'Care': 'Hand Wash Cold' }
      },

      // ── FURNITURE ─────────────────────────────────────────────────────
      {
        name: 'Ergonomic Mesh Office Chair',
        description: 'Premium lumbar support chair with 3D adjustable armrests, breathable mesh back and 360° swivel caster wheels.',
        price: 15999, discountPrice: 11999,
        category: catFurniture._id, sellerId: seller._id, stock: 6, sku: 'FURN-CHAIR-01', status: 'active',
        images: ['https://images.unsplash.com/photo-1580481072645-022f9a6dbf27?w=600&auto=format&fit=crop&q=80'],
        specifications: { 'Max Load': '150 kg', 'Arms': '3D Adjustable', 'Lumbar': 'Adjustable', 'Tilt': '135° Recline' }
      },
      {
        name: 'Minimalist Oak Desk Organizer',
        description: 'Handcrafted solid oak desk set with phone dock, pen tray, paper drawer, and card holder sections.',
        price: 1999, discountPrice: 1499,
        category: catFurniture._id, sellerId: seller._id, stock: 18, sku: 'FURN-DKORG-02', status: 'active',
        images: ['http://localhost:5173/oak_desk_organizer.png'],
        specifications: { 'Wood': 'Solid Oak', 'Finish': 'Natural Matte', 'Compartments': '5', 'Dimensions': '35×20×15 cm' }
      },
      {
        name: 'Scandinavian Bookshelf 5-Tier',
        description: 'Modern open bookshelf in solid pine with a natural finish. Easy self-assembly with included hardware.',
        price: 8999, discountPrice: 6999,
        category: catFurniture._id, sellerId: seller._id, stock: 9, sku: 'FURN-SHELF-03', status: 'active',
        images: ['https://images.unsplash.com/photo-1594620302200-9a762244a156?w=600&auto=format&fit=crop&q=80'],
        specifications: { 'Material': 'Solid Pine', 'Tiers': '5', 'Dimensions': '180×70×25 cm', 'Weight Capacity': '15 kg/shelf' }
      },
      {
        name: 'Memory Foam King Mattress',
        description: '10-inch multi-layer memory foam mattress with cooling gel infusion, motion isolation and 100-night trial.',
        price: 24999, discountPrice: 18999,
        category: catFurniture._id, sellerId: seller._id, stock: 5, sku: 'FURN-MATT-04', status: 'active',
        images: ['https://images.unsplash.com/photo-1631049307264-da0ec9d70304?w=600&auto=format&fit=crop&q=80'],
        specifications: { 'Height': '10 Inches', 'Foam Layers': '4', 'Cooling': 'Gel Infused', 'Trial': '100 Nights' }
      },

      // ── SPORTS ────────────────────────────────────────────────────────
      {
        name: 'Pro Running Shoes',
        description: 'Lightweight carbon-fibre-infused midsole with energy-return foam for marathon runners and daily training.',
        price: 7999, discountPrice: 5999,
        category: catSports._id, sellerId: seller._id, stock: 20, sku: 'SPRT-SHOE-01', status: 'active',
        images: ['https://images.unsplash.com/photo-1595950653106-6c9ebd614d3a?w=600&auto=format&fit=crop&q=80'],
        specifications: { 'Drop': '8mm', 'Weight': '220g', 'Upper': 'Engineered Mesh', 'Midsole': 'Energy Return Foam' }
      },
      {
        name: 'Adjustable Dumbbell Set (5–25 kg)',
        description: 'Space-saving dial-adjust dumbbell pair. Replaces 15 sets of weights and clicks to exact weight in seconds.',
        price: 12999, discountPrice: 9999,
        category: catSports._id, sellerId: seller._id, stock: 11, sku: 'SPRT-DUMB-02', status: 'active',
        images: ['https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=600&auto=format&fit=crop&q=80'],
        specifications: { 'Range': '5–25 kg', 'Adjustment': 'Dial Select', 'Plates': 'Steel + Rubber', 'Grip': 'Anti-Slip' }
      },
      {
        name: 'Yoga Mat Premium Anti-Slip',
        description: 'Extra-thick 6mm TPE yoga mat with alignment lines, dual-sided texture and carry strap. Eco-friendly.',
        price: 1499, discountPrice: 999,
        category: catSports._id, sellerId: seller._id, stock: 45, sku: 'SPRT-YOGA-03', status: 'active',
        images: ['https://images.unsplash.com/photo-1575052814086-f385e2e2ad1b?w=600&auto=format&fit=crop&q=80'],
        specifications: { 'Thickness': '6mm', 'Material': 'Eco-TPE', 'Dimensions': '183×61 cm', 'Texture': 'Dual-sided' }
      },
      {
        name: 'Smart Football',
        description: 'Official size 5 football with embedded smart sensor tracking kicks, speed, spin and training analytics via app.',
        price: 3499, discountPrice: 2799,
        category: catSports._id, sellerId: seller._id, stock: 16, sku: 'SPRT-BALL-04', status: 'active',
        images: ['https://images.unsplash.com/photo-1518063319789-7217e6706b04?w=600&auto=format&fit=crop&q=80'],
        specifications: { 'Size': 'Official 5', 'Sensor': 'IMU 6-axis', 'App': 'iOS + Android', 'Battery': '6 hrs active' }
      },

      // ── BEAUTY ────────────────────────────────────────────────────────
      {
        name: 'Vitamin C Brightening Serum',
        description: '20% pure Vitamin C serum with hyaluronic acid and ferulic acid. Fades dark spots and boosts collagen production.',
        price: 1999, discountPrice: 1499,
        category: catBeauty._id, sellerId: seller._id, stock: 60, sku: 'BEAU-SERUM-01', status: 'active',
        images: ['https://images.unsplash.com/photo-1620916566398-39f1143ab7be?w=600&auto=format&fit=crop&q=80'],
        specifications: { 'Active': '20% Vitamin C', 'Co-actives': 'HA + Ferulic Acid', 'Volume': '30ml', 'Skin': 'All Types' }
      },
      {
        name: 'Matte Lipstick Collection (6 Shades)',
        description: 'Long-lasting creamy matte formula in 6 curated shades. 8-hour wear, transfer-proof, enriched with Vitamin E.',
        price: 1299, discountPrice: 899,
        category: catBeauty._id, sellerId: seller._id, stock: 75, sku: 'BEAU-LIP-02', status: 'active',
        images: ['https://images.unsplash.com/photo-1586495777744-4413f21062fa?w=600&auto=format&fit=crop&q=80'],
        specifications: { 'Shades': '6 Included', 'Wear': '8 Hours', 'Formula': 'Creamy Matte', 'Ingredients': 'Vitamin E' }
      },
      {
        name: 'Argan Oil Hair Mask',
        description: 'Deep conditioning mask with 100% pure Moroccan Argan oil, keratin, and biotin for frizz-free, glossy hair.',
        price: 899, discountPrice: 649,
        category: catBeauty._id, sellerId: seller._id, stock: 48, sku: 'BEAU-HAIR-03', status: 'active',
        images: ['https://images.unsplash.com/photo-1526045612212-70caf35c14df?w=600&auto=format&fit=crop&q=80'],
        specifications: { 'Key Oil': 'Moroccan Argan', 'Protein': 'Keratin + Biotin', 'Volume': '200g', 'Usage': 'Weekly' }
      },

      // ── GROCERIES ─────────────────────────────────────────────────────
      {
        name: 'Cold-Pressed Extra Virgin Olive Oil 1L',
        description: 'Single-origin Greek extra virgin olive oil, cold-pressed within 4 hours of harvest. Acidity <0.3%. Rich flavour.',
        price: 1299, discountPrice: 999,
        category: catGroceries._id, sellerId: seller._id, stock: 80, sku: 'GROC-EVOO-01', status: 'active',
        images: ['https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?w=600&auto=format&fit=crop&q=80'],
        specifications: { 'Origin': 'Greece', 'Acidity': '<0.3%', 'Volume': '1 Litre', 'Press': 'Cold-Pressed' }
      },
      {
        name: 'Organic Honey Raw Unfiltered 500g',
        description: 'Raw forest honey harvested from Himalayan wildflower hives. Unpasteurised, unfiltered, antioxidant-rich.',
        price: 699, discountPrice: 549,
        category: catGroceries._id, sellerId: seller._id, stock: 100, sku: 'GROC-HONEY-02', status: 'active',
        images: ['https://images.unsplash.com/photo-1558642452-9d2a7deb7f62?w=600&auto=format&fit=crop&q=80'],
        specifications: { 'Type': 'Wildflower', 'Source': 'Himalayan Hives', 'Weight': '500g', 'Process': 'Raw Unfiltered' }
      },
      {
        name: 'Premium Arabica Coffee Beans 250g',
        description: 'Single-origin Ethiopian Yirgacheffe medium roast. Notes of blueberry, jasmine and dark chocolate.',
        price: 799, discountPrice: 599,
        category: catGroceries._id, sellerId: seller._id, stock: 65, sku: 'GROC-COFFEE-03', status: 'active',
        images: ['https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?w=600&auto=format&fit=crop&q=80'],
        specifications: { 'Origin': 'Yirgacheffe, Ethiopia', 'Roast': 'Medium', 'Weight': '250g', 'Notes': 'Blueberry, Jasmine' }
      },

      // ── BOOKS ─────────────────────────────────────────────────────────
      {
        name: 'Atomic Habits — James Clear',
        description: 'The #1 bestseller on building good habits and breaking bad ones. Over 10 million copies sold worldwide.',
        price: 699, discountPrice: 499,
        category: catBooks._id, sellerId: seller._id, stock: 90, sku: 'BOOK-ATOMH-01', status: 'active',
        images: ['https://images.unsplash.com/photo-1512820790803-83ca734da794?w=600&auto=format&fit=crop&q=80'],
        specifications: { 'Author': 'James Clear', 'Pages': '320', 'Format': 'Paperback', 'Language': 'English' }
      },
      {
        name: 'Deep Work — Cal Newport',
        description: 'Rules for focused success in a distracted world. Learn to master cognitive performance for meaningful output.',
        price: 599, discountPrice: 429,
        category: catBooks._id, sellerId: seller._id, stock: 70, sku: 'BOOK-DPWRK-02', status: 'active',
        images: ['https://images.unsplash.com/photo-1495446815901-a7297e633e8d?w=600&auto=format&fit=crop&q=80'],
        specifications: { 'Author': 'Cal Newport', 'Pages': '296', 'Format': 'Paperback', 'Language': 'English' }
      },
      {
        name: 'The Design of Everyday Things',
        description: 'Don Norman\'s definitive guide to user-centred design. A must-read for designers, engineers, and anyone who creates.',
        price: 799, discountPrice: 599,
        category: catBooks._id, sellerId: seller._id, stock: 50, sku: 'BOOK-DESGN-03', status: 'active',
        images: ['https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=600&auto=format&fit=crop&q=80'],
        specifications: { 'Author': 'Don Norman', 'Pages': '368', 'Format': 'Paperback', 'Language': 'English' }
      },

      // ── TOYS ──────────────────────────────────────────────────────────
      {
        name: 'STEM Robot Building Kit',
        description: 'Educational 3-in-1 programmable robot kit for kids 8+. Teaches coding logic, electronics, and problem-solving.',
        price: 2499, discountPrice: 1899,
        category: catToysEdu._id, sellerId: seller._id, stock: 30, sku: 'TOYS-ROBOT-01', status: 'active',
        images: ['http://localhost:5173/stem_robot_kit.png'],
        specifications: { 'Age Group': '8+ Years', 'Skill': 'STEM/Coding', 'Modes': '3-in-1 Builds', 'Language': 'Block Coding', 'Pieces': '200+' }
      },
      {
        name: 'Wooden Montessori Shape Sorter',
        description: 'Classic rainbow stacking toy crafted from solid beech wood with non-toxic organic paint. Develops fine motor skills.',
        price: 899, discountPrice: 699,
        category: catToysEdu._id, sellerId: seller._id, stock: 45, sku: 'TOYS-SORT-02', status: 'active',
        images: ['https://images.unsplash.com/photo-1587654780291-39c9404d746b?w=600&auto=format&fit=crop&q=80'],
        specifications: { 'Age Group': '1-4 Years', 'Skill': 'Motor Skills', 'Material': 'Solid Beech Wood', 'Paint': 'Non-toxic Organic', 'Pieces': '9 Shapes' }
      },
      {
        name: 'Remote Control Racing Car',
        description: '1:10 scale RC car with 30+ km/h speed, 4WD all-terrain tyres and 2.4GHz interference-free remote.',
        price: 3499, discountPrice: 2699,
        category: catToysAction._id, sellerId: seller._id, stock: 22, sku: 'TOYS-RCCAR-03', status: 'active',
        images: ['https://images.unsplash.com/photo-1594736797933-d0501ba2fe65?w=600&auto=format&fit=crop&q=80'],
        specifications: { 'Age Group': '5-12 Years', 'Skill': 'Coordination', 'Scale': '1:10', 'Speed': '30+ km/h', 'Drive': '4WD', 'Remote': '2.4GHz 50m range' }
      },

      // ── KITCHEN ──────────────────────────────────────────────────────
      {
        name: 'Non-Stick Cookware Set 5-Piece',
        description: 'Tri-ply stainless steel pans with ceramic non-stick coating, induction compatible and heat-resistant handles.',
        price: 4999, discountPrice: 3799,
        category: catKitchen._id, sellerId: seller._id, stock: 20, sku: 'KTCHN-COOK-01', status: 'active',
        images: ['https://images.unsplash.com/photo-1584269600464-37b1b58a9fe7?w=600&auto=format&fit=crop&q=80'],
        specifications: { 'Pieces': '5', 'Material': 'Tri-ply SS', 'Compatible': 'Induction + Gas', 'Coating': 'Ceramic Non-Stick' }
      },
      {
        name: 'Digital Air Fryer 5L',
        description: 'Rapid hot-air circulation with 12 preset programs, digital display and dishwasher-safe basket.',
        price: 6499, discountPrice: 4999,
        category: catKitchen._id, sellerId: seller._id, stock: 14, sku: 'KTCHN-AIRFRY-02', status: 'active',
        images: ['https://images.unsplash.com/photo-1621972750749-0fbb1abb7736?w=600&auto=format&fit=crop&q=80'],
        specifications: { 'Capacity': '5 Litres', 'Wattage': '1700W', 'Programs': '12 Presets', 'Temp': '80°C–200°C' }
      },
      {
        name: 'Cold Press Slow Juicer',
        description: 'Masticating slow juicer at 60 RPM for maximum nutrient retention. Works on fruits, veggies and leafy greens.',
        price: 8999, discountPrice: 6999,
        category: catKitchen._id, sellerId: seller._id, stock: 10, sku: 'KTCHN-JUCR-03', status: 'active',
        images: ['http://localhost:5173/cold_press_slow_juicer.png'],
        specifications: { 'Speed': '60 RPM', 'Motor': '200W', 'Yield': 'Up to 85%', 'Parts': 'Dishwasher Safe' }
      },

      // ── HEALTH & WELLNESS ────────────────────────────────────────────
      {
        name: 'Smart Body Weighing Scale',
        description: 'Measures 13 body metrics via bioelectrical impedance. Syncs to iOS and Android via Bluetooth 5.0.',
        price: 2499, discountPrice: 1799,
        category: catHealth._id, sellerId: seller._id, stock: 35, sku: 'HLTH-SCALE-01', status: 'active',
        images: ['https://images.unsplash.com/photo-1580100586938-02822d99c4a8?w=600&auto=format&fit=crop&q=80'],
        specifications: { 'Metrics': '13 Body Stats', 'Sync': 'Bluetooth 5.0', 'Capacity': '180 kg', 'Surface': 'Tempered Glass' }
      },
      {
        name: 'Whey Protein Isolate 1kg — Chocolate',
        description: '25g protein per serving, 5g BCAA, low sugar, Informed Sport certified. Mixes instantly with zero clumping.',
        price: 2999, discountPrice: 2399,
        category: catHealth._id, sellerId: seller._id, stock: 50, sku: 'HLTH-PROT-02', status: 'active',
        images: ['https://images.unsplash.com/photo-1593095948071-474c5cc2989d?w=600&auto=format&fit=crop&q=80'],
        specifications: { 'Protein': '25g/serving', 'BCAA': '5g', 'Servings': '33', 'Certified': 'Informed Sport' }
      },
      {
        name: 'Smart UV Sterilizing Water Bottle',
        description: 'Double-walled vacuum insulated bottle with built-in UV-C LED that purifies water and cleans the inner surfaces of the bottle.',
        price: 3999, discountPrice: 2999,
        category: catHealth._id, sellerId: seller._id, stock: 28, sku: 'HLTH-BOTT-03', status: 'active',
        images: ['https://images.unsplash.com/photo-1602143407151-7111542de6e8?w=600&auto=format&fit=crop&q=80'],
        specifications: { 'Capacity': '600ml', 'Technology': 'UV-C LED', 'Insulation': '24 hrs Cold / 12 hrs Hot', 'Battery': 'Rechargeable' }
      },

      // ── GAMING ───────────────────────────────────────────────────────
      {
        name: 'Wireless Gaming Controller Pro',
        description: 'Hall-effect joysticks, 40hr battery, vibration haptic feedback and 3.5mm audio jack for all major platforms.',
        price: 3499, discountPrice: 2799,
        category: catGaming._id, sellerId: seller._id, stock: 22, sku: 'GAME-CTRL-01', status: 'active',
        images: ['https://images.unsplash.com/photo-1592840496694-26d035b52b48?w=600&auto=format&fit=crop&q=80'],
        specifications: { 'Connection': '2.4GHz + BT', 'Battery': '40 Hours', 'Joystick': 'Hall Effect', 'Audio': '3.5mm' }
      },
      {
        name: '7.1 Surround Gaming Headset',
        description: 'Virtual 7.1 surround, noise-cancelling flip mic, 50mm drivers, RGB lighting. PC/PS5/Xbox compatible.',
        price: 2999, discountPrice: 2299,
        category: catGaming._id, sellerId: seller._id, stock: 18, sku: 'GAME-HSET-02', status: 'active',
        images: ['https://images.unsplash.com/photo-1618366712010-f4ae9c647dcb?w=600&auto=format&fit=crop&q=80'],
        specifications: { 'Surround': '7.1 Virtual', 'Drivers': '50mm', 'Mic': 'Retractable NC', 'Platform': 'PC/PS5/Xbox' }
      },
      {
        name: 'Optical Gaming Mouse 16000 DPI',
        description: '7 programmable buttons, per-key RGB, 16000 DPI sensor and 1000Hz polling rate for competitive gaming.',
        price: 2199, discountPrice: 1699,
        category: catGaming._id, sellerId: seller._id, stock: 25, sku: 'GAME-MOUSE-03', status: 'active',
        images: ['https://images.unsplash.com/photo-1615663245857-ac93bb7c39e7?w=600&auto=format&fit=crop&q=80'],
        specifications: { 'DPI': '200–16000', 'Buttons': '7 Programmable', 'Polling': '1000Hz', 'RGB': 'Per-key' }
      },

      // ── PET SUPPLIES ─────────────────────────────────────────────────
      {
        name: 'Premium Dry Dog Food — Chicken & Rice 3kg',
        description: 'Complete balanced adult dog food. Real chicken as first ingredient, no artificial preservatives or fillers.',
        price: 1299, discountPrice: 999,
        category: catPets._id, sellerId: seller._id, stock: 60, sku: 'PET-DOG-01', status: 'active',
        images: ['https://images.unsplash.com/photo-1589924691995-400dc9ecc119?w=600&auto=format&fit=crop&q=80'],
        specifications: { 'Protein': '28%', 'Main Ingredient': 'Real Chicken', 'Weight': '3 kg', 'Preservatives': 'None' }
      },
      {
        name: 'Automatic Pet Water Fountain 2.5L',
        description: 'Whisper-quiet pump keeps water fresh 24/7 with triple-layer carbon filtration. For cats and small dogs.',
        price: 1799, discountPrice: 1299,
        category: catPets._id, sellerId: seller._id, stock: 32, sku: 'PET-WATER-02', status: 'active',
        images: ['http://localhost:5173/water_fountain.png'],
        specifications: { 'Capacity': '2.5 Litres', 'Pump': 'Silent 1.5W', 'Filter': '3-layer Carbon', 'Power': 'USB-C' }
      },

      // ── TRAVEL ───────────────────────────────────────────────────────
      {
        name: 'Hardshell Cabin Trolley Bag 55cm',
        description: 'PC hardshell suitcase with TSA-approved lock, 360° spinner wheels and expandable zip panel. Ultra-light.',
        price: 4999, discountPrice: 3499,
        category: catTravel._id, sellerId: seller._id, stock: 20, sku: 'TRV-TROLL-01', status: 'active',
        images: ['https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=600&auto=format&fit=crop&q=80'],
        specifications: { 'Size': 'Cabin 55cm', 'Shell': 'Polycarbonate', 'Lock': 'TSA Approved', 'Wheels': '4× 360° Spinner' }
      },
      {
        name: 'Memory Foam Travel Neck Pillow',
        description: 'Ergonomic memory foam pillow with washable velvet cover. Compresses small with carry pouch. 180g.',
        price: 999, discountPrice: 699,
        category: catTravel._id, sellerId: seller._id, stock: 55, sku: 'TRV-PILW-02', status: 'active',
        images: ['http://localhost:5173/travel_pillow.png'],
        specifications: { 'Fill': 'Memory Foam', 'Cover': 'Velvet Washable', 'Packs': 'Carry Pouch', 'Weight': '180g' }
      },
      {
        name: 'Universal Travel Adapter with USB-C 30W',
        description: 'Works in 150+ countries. 4 USB-A + 1 USB-C PD 30W + 2 AC sockets simultaneously. Built-in surge protection.',
        price: 1499, discountPrice: 1099,
        category: catTravel._id, sellerId: seller._id, stock: 45, sku: 'TRV-ADPT-03', status: 'active',
        images: ['http://localhost:5173/travel_adapter.png'],
        specifications: { 'Countries': '150+', 'USB-C PD': '30W', 'USB-A': '4 Ports', 'AC': '2 Simultaneous' }
      },

      // ── BABY & KIDS ──────────────────────────────────────────────────
      {
        name: 'Organic Cotton Baby Bodysuit Set (5-pack)',
        description: 'GOTS certified 100% organic cotton onesies in 5 pastel colours. Breathable, skin-safe dyes, 0–18 months.',
        price: 1299, discountPrice: 999,
        category: catBaby._id, sellerId: seller._id, stock: 40, sku: 'BABY-SUIT-01', status: 'active',
        images: ['https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?w=600&auto=format&fit=crop&q=80'],
        specifications: { 'Certification': 'GOTS Organic', 'Pieces': '5', 'Ages': '0–18 Months', 'Dyes': 'Skin-Safe' }
      },
      {
        name: 'Baby Monitor with 1080p Night Vision',
        description: '5" IPS screen, 1080p camera, 2-way audio, infrared night vision and room temperature sensor.',
        price: 4999, discountPrice: 3799,
        category: catBaby._id, sellerId: seller._id, stock: 16, sku: 'BABY-MON-02', status: 'active',
        images: ['http://localhost:5173/baby_monitor.png'],
        specifications: { 'Screen': '5" IPS', 'Camera': '1080p', 'Vision': 'IR Night', 'Audio': '2-Way Talk-Back' }
      },
      {
        name: 'Educational Wooden Puzzle Set (5 Themes)',
        description: 'Animals, numbers, alphabets, shapes and colours — 5 themed wooden puzzles. Non-toxic BPA-free paint.',
        price: 1099, discountPrice: 799,
        category: catBaby._id, sellerId: seller._id, stock: 50, sku: 'BABY-PUZZ-03', status: 'active',
        images: ['http://localhost:5173/wooden_puzzle.png'],
        specifications: { 'Sets': '5 Themed', 'Age': '2–6 Years', 'Material': 'Solid Wood', 'Safety': 'BPA-Free' }
      },
    ];

    await Product.insertMany(products);
    console.log(`✔ ${products.length} products seeded successfully.`);
    console.log('\n🎉 Database Seeding Completed Successfully!');
    console.log('─────────────────────────────────────────');
    console.log('  seller@shopez.com    → pw: 123456');
    console.log('  customer@shopez.com  → pw: 123456');
    console.log('  admin@shopez.com     → pw: 123456');
    console.log('  delivery@shopez.com  → pw: 123456');
    console.log('─────────────────────────────────────────');
    process.exit(0);
  } catch (error) {
    console.error(`Error Seeding Database: ${error.message}`);
    process.exit(1);
  }
};

seedDB();
