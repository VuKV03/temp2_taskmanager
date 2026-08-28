import { seedRoles } from './role.seed.js';
import { seedAdminUser } from './admin-user.seed.js';

/**
 * Main seeder entry point
 * Run with: npm run seed
 */
async function runSeeds() {
  // Prevent running in production
  if (process.env.NODE_ENV === 'production') {
    console.error('❌ Seeds are disabled in production environment');
    process.exit(1);
  }

  try {
    console.log('🌱 Starting database seeding...');

    await seedRoles();
    await seedAdminUser();

    console.log('🎉 Database seeding completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Seeding failed:', error);
    process.exit(1);
  }
}

runSeeds();
