export const getProductVariants = (product) => {
  if (!product) return { label: 'Select Option', options: ['Standard'] };

  const name = product.name || '';
  const categoryName = product.category?.name || '';

  if (categoryName.toLowerCase().includes('fashion') || name.includes('Shoes') || name.includes('Jacket') || name.includes('Hoodie') || name.includes('Dress') || name.includes('Scarf')) {
    if (name.includes('Shoes') || name.includes('Oxford') || name.includes('Running')) {
      return {
        label: 'Select Size (UK)',
        options: ['UK 7', 'UK 8', 'UK 9', 'UK 10', 'UK 11'],
      };
    }
    if (name.includes('Scarf')) {
      return {
        label: 'Select Color',
        options: ['Pink (Standard)', 'Classic Beige', 'Charcoal Gray'],
      };
    }
    return {
      label: 'Select Size',
      options: ['Small (S)', 'Medium (M)', 'Large (L)', 'Extra Large (XL)'],
    };
  }

  if (categoryName.toLowerCase().includes('mobiles') || categoryName.toLowerCase().includes('electronics') || categoryName.toLowerCase().includes('gaming') || name.includes('Monitor') || name.includes('Adapter')) {
    if (name.includes('Smartphone') || name.includes('ProMax')) {
      return {
        label: 'Select Storage',
        options: ['128GB Storage', '256GB Storage', '512GB Storage'],
      };
    }
    if (name.includes('Headphones') || name.includes('Earbuds') || name.includes('Headset')) {
      return {
        label: 'Select Color',
        options: ['Matte Black', 'Frost White', 'Midnight Blue'],
      };
    }
    if (name.includes('Keyboard')) {
      return {
        label: 'Select Switches',
        options: ['Tactile Brown', 'Linear Red', 'Clicky Blue'],
      };
    }
    if (name.includes('Tracker') || name.includes('Fitness')) {
      return {
        label: 'Select Strap Color',
        options: ['Classic Black', 'Active Orange', 'Navy Blue'],
      };
    }
    if (name.includes('Controller')) {
      return {
        label: 'Select Edition',
        options: ['Pro Wireless', 'Elite Wired'],
      };
    }
    if (name.includes('Mouse')) {
      return {
        label: 'Select Color',
        options: ['Stealth Black', 'Pure White'],
      };
    }
    if (name.includes('Monitor')) {
      return {
        label: 'Select Screen size',
        options: ['5" IPS Display', '7" IPS High-Def Display'],
      };
    }
    if (name.includes('Adapter')) {
      return {
        label: 'Select Power Output',
        options: ['30W Standard', '65W GaN Fast'],
      };
    }
  }

  if (categoryName.toLowerCase().includes('grocer') || categoryName.toLowerCase().includes('health') || categoryName.toLowerCase().includes('beauty') || name.includes('Coffee') || name.includes('Honey') || name.includes('Olive Oil') || name.includes('Protein') || name.includes('Serum') || name.includes('Lipstick') || name.includes('Hair Mask')) {
    if (name.includes('Coffee')) {
      return {
        label: 'Select Pack Weight',
        options: ['250g Medium Roast', '500g Value Pack', '1kg Bulk Bag'],
      };
    }
    if (name.includes('Honey')) {
      return {
        label: 'Select Net Weight',
        options: ['250g Trial Jar', '500g Classic Jar', '1kg Family Tub'],
      };
    }
    if (name.includes('Olive Oil')) {
      return {
        label: 'Select Volume',
        options: ['500ml Bottle', '1L Tin Bottle', '2L Value Can'],
      };
    }
    if (name.includes('Protein') || name.includes('Whey')) {
      return {
        label: 'Select Flavor / Pack',
        options: ['Double Rich Chocolate (1kg)', 'French Vanilla Cream (1kg)', 'Double Rich Chocolate (2kg)'],
      };
    }
    if (name.includes('Serum')) {
      return {
        label: 'Select Volume',
        options: ['15ml Travel Size', '30ml Standard Bottle', '50ml Double Pack'],
      };
    }
    if (name.includes('Lipstick')) {
      return {
        label: 'Select Color Pack',
        options: ['6 Shades Set', 'Single Shade Trial'],
      };
    }
    if (name.includes('Hair Mask')) {
      return {
        label: 'Select Jar size',
        options: ['100g Travel Tube', '200g Standard Tub', '500g Salon Pack'],
      };
    }
  }

  if (categoryName.toLowerCase().includes('furniture')) {
    if (name.includes('Chair')) {
      return {
        label: 'Select Ergonomic Spec',
        options: ['Mesh Lumbar Standard', 'Leatherette High-Back'],
      };
    }
    if (name.includes('Organizer')) {
      return {
        label: 'Select Wood Finish',
        options: ['Natural Matte Oak', 'Walnut Matte Finish'],
      };
    }
    if (name.includes('Bookshelf')) {
      return {
        label: 'Select Shelves Size',
        options: ['3-Tier Compact', '5-Tier Standard'],
      };
    }
    if (name.includes('Mattress')) {
      return {
        label: 'Select Mattress Size',
        options: ['King Size (72" x 78")', 'Queen Size (60" x 78")', 'Single Size (36" x 78")'],
      };
    }
  }

  if (categoryName.toLowerCase().includes('travel')) {
    if (name.includes('Trolley') || name.includes('Bag')) {
      return {
        label: 'Select Trolley Size',
        options: ['Cabin 55cm', 'Medium 65cm', 'Large 75cm'],
      };
    }
    if (name.includes('Pillow')) {
      return {
        label: 'Select Pillow Cover Color',
        options: ['Velvet Navy Blue', 'Velvet Slate Gray'],
      };
    }
  }

  if (categoryName.toLowerCase().includes('pet')) {
    if (name.includes('Dog Food') || name.includes('Cat Food')) {
      return {
        label: 'Select Pack Weight',
        options: ['1.2kg Trial Bag', '3kg Standard Bag', '10kg Bulk Saver Pack'],
      };
    }
    if (name.includes('Fountain')) {
      return {
        label: 'Select Bundle Pack',
        options: ['2.5L Standard Fountain', '2.5L Fountain + 3 Filter Pack'],
      };
    }
  }

  if (categoryName.toLowerCase().includes('baby') || categoryName.toLowerCase().includes('toys')) {
    if (name.includes('Robot')) {
      return {
        label: 'Select Kit Level',
        options: ['STEM Starter Set', 'STEM Advanced Program Set'],
      };
    }
    if (name.includes('Puzzle')) {
      return {
        label: 'Select Theme Pack',
        options: ['5 Themes Set', '3 Themes Starter Set'],
      };
    }
    if (name.includes('Car')) {
      return {
        label: 'Select Remote Car Color',
        options: ['Racing Blue', 'Stealth Black', 'Speed Fire Red'],
      };
    }
    if (name.includes('Bodysuit') || name.includes('onesies')) {
      return {
        label: 'Select Baby Age Group',
        options: ['0-3 Months', '3-6 Months', '6-12 Months', '12-18 Months'],
      };
    }
  }

  if (categoryName.toLowerCase().includes('sports')) {
    if (name.includes('Dumbbell')) {
      return {
        label: 'Select Dumbbell Pack',
        options: ['Single Dumbbell (25kg)', 'Dumbbell Pair (25kg x 2)'],
      };
    }
    if (name.includes('Yoga')) {
      return {
        label: 'Select Thickness',
        options: ['6mm Standard TPE', '8mm Extra Cushion TPE'],
      };
    }
  }

  return {
    label: 'Select Edition',
    options: ['Standard Edition', 'Premium Bundle'],
  };
};

export const getVariantImpact = (product, selectedVariant) => {
  if (!product || !selectedVariant) return { priceOffset: 0, specs: {} };

  const name = product.name || '';
  const categoryName = product.category?.name || '';

  if (name.includes('Monitor') && selectedVariant.includes('7"')) {
    return { priceOffset: 1200, specs: { SCREEN: '7" IPS High-Def' } };
  }

  if (name.includes('Puzzle') && selectedVariant.includes('3 Themes')) {
    return { priceOffset: -300, specs: { SETS: '3 Themed' } };
  }

  if (name.includes('Robot') && selectedVariant.includes('Advanced')) {
    return { priceOffset: 1500, specs: { 'KIT LEVEL': 'Advanced Program' } };
  }

  if (name.includes('Car') && (categoryName.toLowerCase().includes('toys') || categoryName.toLowerCase().includes('baby'))) {
    const colorSelected = selectedVariant.replace('Racing ', '').replace('Stealth ', '').replace('Speed Fire ', '');
    return { priceOffset: 0, specs: { COLOR: colorSelected } };
  }

  if (name.includes('Bodysuit') || name.includes('onesies')) {
    return { priceOffset: 0, specs: { 'AGE GROUP': selectedVariant, SIZE: selectedVariant } };
  }

  if (name.includes('Yoga') && selectedVariant.includes('8mm')) {
    return { priceOffset: 400, specs: { THICKNESS: '8mm Extra Cushion' } };
  }

  if (name.includes('Trolley') || name.includes('Bag') && categoryName.toLowerCase().includes('travel')) {
    if (selectedVariant.includes('Medium 65cm')) {
      return { priceOffset: 1500, specs: { SIZE: 'Medium 65cm', CAPACITY: '65 Liters' } };
    }
    if (selectedVariant.includes('Large 75cm')) {
      return { priceOffset: 3000, specs: { SIZE: 'Large 75cm', CAPACITY: '95 Liters' } };
    }
  }

  if (name.includes('Food') && categoryName.toLowerCase().includes('pet')) {
    if (selectedVariant.includes('3kg')) {
      return { priceOffset: 800, specs: { WEIGHT: '3kg Standard Bag' } };
    }
    if (selectedVariant.includes('10kg')) {
      return { priceOffset: 2500, specs: { WEIGHT: '10kg Bulk Saver Pack' } };
    }
  }

  if (name.includes('Fountain') && selectedVariant.includes('Filter Pack')) {
    return { priceOffset: 500, specs: { INCLUDED: 'Fountain + 3 Carbon Filters' } };
  }

  if (name.includes('Smartphone') || name.includes('ProMax')) {
    if (selectedVariant.includes('256GB')) {
      return { priceOffset: 5000, specs: { STORAGE: '256GB NVMe' } };
    }
    if (selectedVariant.includes('512GB')) {
      return { priceOffset: 12000, specs: { STORAGE: '512GB NVMe' } };
    }
  }

  if (name.includes('Keyboard')) {
    if (selectedVariant.includes('Linear Red')) {
      return { priceOffset: 300, specs: { SWITCHES: 'Linear Red (Silent)' } };
    }
    if (selectedVariant.includes('Clicky Blue')) {
      return { priceOffset: 150, specs: { SWITCHES: 'Clicky Blue (Tactile)' } };
    }
  }

  if (categoryName.toLowerCase().includes('electronics') || categoryName.toLowerCase().includes('mobiles') || categoryName.toLowerCase().includes('gaming')) {
    if (selectedVariant.includes('Black') || selectedVariant.includes('White') || selectedVariant.includes('Blue') || selectedVariant.includes('Orange')) {
      return { priceOffset: 0, specs: { COLOR: selectedVariant, 'STRAP COLOR': selectedVariant } };
    }
    if (selectedVariant.includes('Elite Wired')) {
      return { priceOffset: -1000, specs: { EDITION: 'Elite Wired', INTERFACE: 'USB Wired' } };
    }
  }

  if (categoryName.toLowerCase().includes('fashion')) {
    if (selectedVariant.includes('UK') || selectedVariant.includes('S') || selectedVariant.includes('M') || selectedVariant.includes('L') || selectedVariant.includes('XL')) {
      return { priceOffset: 0, specs: { SIZE: selectedVariant } };
    }
    return { priceOffset: 0, specs: { COLOR: selectedVariant } };
  }

  if (name.includes('Coffee') || name.includes('Honey') || name.includes('Olive Oil') || name.includes('Protein') || name.includes('Whey')) {
    if (selectedVariant.includes('500g') || selectedVariant.includes('500ml') || selectedVariant.includes('2L') || selectedVariant.includes('2kg')) {
      return { priceOffset: 600, specs: { WEIGHT: selectedVariant, VOLUME: selectedVariant } };
    }
    if (selectedVariant.includes('1kg') || selectedVariant.includes('1L') || selectedVariant.includes('Family')) {
      return { priceOffset: 1200, specs: { WEIGHT: selectedVariant, VOLUME: selectedVariant } };
    }
  }

  if (name.includes('Dumbbell') && selectedVariant.includes('Pair')) {
    return { priceOffset: 3200, specs: { CONFIGURATION: 'Pair (25kg x 2)' } };
  }

  if (selectedVariant === 'Premium Bundle') {
    return { priceOffset: 800, specs: { EDITION: 'Premium Bundle (Includes Extra Accessories)' } };
  }

  return { priceOffset: 0, specs: {} };
};

export const mergeVariantSpecs = (baseSpecs = {}, variantSpecs = {}) => {
  const displaySpecs = { ...baseSpecs };

  Object.entries(variantSpecs).forEach(([key, value]) => {
    const matchKey = Object.keys(displaySpecs).find((candidate) => candidate.toLowerCase() === key.toLowerCase()) || key;
    displaySpecs[matchKey] = value;
  });

  return displaySpecs;
};
