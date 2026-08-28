import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from '../auth/entities/user.entity.js';
import { Role } from '../auth/entities/role.entity.js';
import { RefreshToken } from '../auth/entities/refresh-token.entity.js';
import { Task } from '../task/entities/task.entity.js';
import { RefreshTokenRepository } from '../auth/repositories/refresh-token.repository.js';
import { AdminUserRepository } from './repositories/admin-user.repository.js';
import { AdminUserService } from './services/admin-user.service.js';
import { AdminUserController } from './controllers/admin-user.controller.js';
import { ActivityModule } from '../activity/activity.module.js';

/**
 * `User`/`Role`/`RefreshToken`/`Task` registered directly (not via
 * `AuthModule`/`TaskModule`) — same reasoning as `activity`/`statistic`:
 * only the raw repositories are needed, avoids pulling in unrelated
 * providers/controllers. `RefreshTokenRepository` re-declared as a provider
 * here since `AuthModule` doesn't export the class itself, only
 * `AuthService`/`UserRepository`.
 */
@Module({
  imports: [TypeOrmModule.forFeature([User, Role, RefreshToken, Task]), ActivityModule],
  controllers: [AdminUserController],
  providers: [AdminUserRepository, AdminUserService, RefreshTokenRepository],
})
export class UserManagementModule {}
