import { createCoffee } from '../models/coffee.js';
import { createBrewSession } from '../models/brew.js';

/**
 * Seed the database with sample data for testing
 */
export async function seedDatabase() {
  console.log('Seeding database with sample data...');

  // Sample coffees
  const coffees = [
    {
      roaster: 'Heart Coffee Roasters',
      name: 'Colombia La Esmeralda',
      origin: 'La Esmeralda Farm',
      region: 'Huila, Colombia',
      process: 'washed',
      roast_date: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 5 days ago
      roast_level: 'light',
      price_per_kg: 45.50,
      notes: 'Sweet citrus, caramel, chocolate',
      state: 'active'
    },
    {
      roaster: 'Stumptown Coffee',
      name: 'Ethiopia Duromina',
      origin: 'Duromina Cooperative',
      region: 'Sidama, Ethiopia',
      process: 'natural',
      roast_date: new Date(Date.now() - 12 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 12 days ago
      roast_level: 'medium-light',
      price_per_kg: 52.00,
      notes: 'Blueberry, jasmine, honey',
      state: 'active'
    },
    {
      roaster: 'Onyx Coffee Lab',
      name: 'Kenya Kirinyaga',
      origin: 'Kirinyaga County',
      region: 'Central Kenya',
      process: 'washed',
      roast_date: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 8 days ago
      roast_level: 'medium',
      price_per_kg: 48.75,
      notes: 'Blackcurrant, tomato, brown sugar',
      state: 'active'
    }
  ];

  const createdCoffees = [];
  for (const coffee of coffees) {
    const created = createCoffee(coffee);
    createdCoffees.push(created);
    console.log(`✓ Created coffee: ${created.roaster} - ${created.name}`);
  }

  // Sample brew sessions for each coffee
  const brewSamples = [
    // Colombia La Esmeralda - Espresso
    {
      coffee_id: createdCoffees[0].id,
      method: 'espresso',
      dose: 18,
      yield: 36,
      brew_time: 28,
      tds: 9.5,
      grind_setting: 4.2,
      water_temp: 93,
      pre_infusion_time: 5,
      pre_infusion_pressure: 2,
      full_pressure: 9,
      rating: 4,
      notes: 'Good balance, slightly sour finish'
    },
    {
      coffee_id: createdCoffees[0].id,
      method: 'espresso',
      dose: 18,
      yield: 38,
      brew_time: 30,
      tds: 9.2,
      grind_setting: 4.3,
      water_temp: 93,
      pre_infusion_time: 5,
      pre_infusion_pressure: 2,
      full_pressure: 9,
      rating: 5,
      notes: 'Perfect! Sweet and balanced'
    },
    // Ethiopia Duromina - Pourover
    {
      coffee_id: createdCoffees[1].id,
      method: 'pourover',
      dose: 20,
      yield: 320,
      brew_time: 2.5,
      tds: 1.35,
      grind_setting: 6.5,
      water_temp: 96,
      bloom_time: 30,
      bloom_water: 40,
      rating: 5,
      notes: 'Bright florals, clean cup'
    },
    {
      coffee_id: createdCoffees[1].id,
      method: 'pourover',
      dose: 20,
      yield: 320,
      brew_time: 2.75,
      tds: 1.28,
      grind_setting: 6.0,
      water_temp: 96,
      bloom_time: 30,
      bloom_water: 40,
      rating: 4,
      notes: 'Slightly over-extracted, adjust grind coarser'
    },
    // Kenya Kirinyaga - Batch
    {
      coffee_id: createdCoffees[2].id,
      method: 'batch',
      dose: 100,
      water_volume: 1.6,
      brew_time: 4,
      tds: 1.32,
      grind_setting: 7.0,
      water_temp: 96,
      rating: 4,
      notes: 'Solid daily option'
    },
    {
      coffee_id: createdCoffees[2].id,
      method: 'batch',
      dose: 100,
      water_volume: 1.6,
      brew_time: 4.25,
      tds: 1.38,
      grind_setting: 7.2,
      water_temp: 96,
      rating: 5,
      notes: 'Great depth, customers love it'
    }
  ];

  for (const brew of brewSamples) {
    const created = createBrewSession(brew);
    console.log(`✓ Created brew: ${brew.method} for coffee ${brew.coffee_id}`);
  }

  console.log('\n✓ Database seeded successfully!');
  console.log(`  ${createdCoffees.length} coffees`);
  console.log(`  ${brewSamples.length} brew sessions`);
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  import('../database.js').then(({ initializeDatabase }) => {
    initializeDatabase();
    seedDatabase();
  });
}
