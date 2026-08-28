import { AppDataSource } from '../../config/typeorm.config.js';
import { User } from '../../features/auth/entities/user.entity.js';
import { Role } from '../../features/auth/entities/role.entity.js';
import { hashPassword } from '../../shared/utils/hash.util.js';

/**
 * Seed default admin user
 * Email: admin@local.dev
 * Password: Admin@12345
 * Only for local development
 */
export async function seedAdminUser() {
  if (!AppDataSource.isInitialized) {
    await AppDataSource.initialize();
  }

  const userRepository = AppDataSource.getRepository(User);
  const roleRepository = AppDataSource.getRepository(Role);

  // Check if admin already exists
  const existingAdmin = await userRepository.findOne({
    where: { email: 'admin@local.dev' },
  });

  if (existingAdmin) {
    console.log('ℹ️  Admin user already exists, skipping...');
    return;
  }

  // Get admin role
  const adminRole = await roleRepository.findOne({
    where: { name: 'admin' },
  });

  if (!adminRole) {
    throw new Error('Admin role not found. Run seedRoles() first.');
  }

  const passwordHash = await hashPassword('Admin@12345');

  const adminUser = userRepository.create({
    email: 'admin@local.dev',
    passwordHash,
    fullName: 'Admin User',
    role: adminRole,
    roleId: adminRole.id,
    timezone: 'Asia/Ho_Chi_Minh',
    isActive: true,
  });

  await userRepository.save(adminUser);
  console.log('✅ Admin user seeded: admin@local.dev / Admin@12345');
}
