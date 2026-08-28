import { AppDataSource } from '../../config/typeorm.config.js';
import { Role } from '../../features/auth/entities/role.entity.js';

/**
 * Seed roles (admin, member)
 * Must be called before user.seed.ts
 */
export async function seedRoles() {
  if (!AppDataSource.isInitialized) {
    await AppDataSource.initialize();
  }

  const roleRepository = AppDataSource.getRepository(Role);

  // Check if roles already exist
  const existingRoles = await roleRepository.find();
  if (existingRoles.length > 0) {
    console.log('ℹ️  Roles already seeded, skipping...');
    return;
  }

  // Create roles
  const adminRole = roleRepository.create({
    name: 'admin',
    description: 'Administrator with full access',
  });

  const memberRole = roleRepository.create({
    name: 'member',
    description: 'Regular user with personal task management',
  });

  await roleRepository.save([adminRole, memberRole]);
  console.log('✅ Roles seeded: admin, member');
}
