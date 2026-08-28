import { Injectable } from '@nestjs/common';
import { InjectDataSource, InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { AppException } from '../../../shared/exceptions/app.exception.js';
import { ERROR_CODES } from '../../../shared/constants/error-codes.constant.js';
import { hashPassword } from '../../../shared/utils/hash.util.js';
import type { JwtPayload } from '../../../shared/decorators/current-user.decorator.js';
import type { PaginatedMeta } from '../../../shared/dto/pagination-query.dto.js';
import { ActivityLoggerService } from '../../activity/services/activity-logger.service.js';
import { RefreshTokenRepository } from '../../auth/repositories/refresh-token.repository.js';
import { User } from '../../auth/entities/user.entity.js';
import { toUserResponse } from '../../auth/types/auth.types.js';
import type { UserResponse } from '../../auth/types/auth.types.js';
import { Task } from '../../task/entities/task.entity.js';
import { TaskStatus } from '../../task/types/task.types.js';
import { AdminUserRepository } from '../repositories/admin-user.repository.js';
import { toAdminUserDetailResponse } from '../types/user-management.types.js';
import type { AdminUserDetailResponse, TaskStatsSummary } from '../types/user-management.types.js';
import type { CreateUserDto } from '../dto/create-user.dto.js';
import type { UpdateUserDto } from '../dto/update-user.dto.js';
import type { UpdateRoleDto } from '../dto/update-role.dto.js';
import type { UpdateStatusDto } from '../dto/update-status.dto.js';
import type { ResetPasswordDto } from '../dto/reset-password.dto.js';
import type { QueryUserDto } from '../dto/query-user.dto.js';

@Injectable()
export class AdminUserService {
  constructor(
    @InjectDataSource() private readonly dataSource: DataSource,
    @InjectRepository(Task) private readonly taskRepo: Repository<Task>,
    private readonly adminUserRepository: AdminUserRepository,
    private readonly refreshTokenRepository: RefreshTokenRepository,
    private readonly activityLogger: ActivityLoggerService,
  ) {}

  async findMany(query: QueryUserDto): Promise<{ data: UserResponse[]; meta: PaginatedMeta }> {
    const { items, total } = await this.adminUserRepository.findMany(query);
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    return { data: items.map(toUserResponse), meta: { page, limit, total, totalPages: Math.ceil(total / limit) || 0 } };
  }

  async findOne(id: number): Promise<AdminUserDetailResponse> {
    const user = await this.getUserOrThrow(id);
    const taskStats = await this.getTaskStats(id);
    return toAdminUserDetailResponse(user, taskStats);
  }

  async create(dto: CreateUserDto): Promise<UserResponse> {
    const existing = await this.adminUserRepository.findByEmail(dto.email);
    if (existing) throw new AppException(ERROR_CODES.AUTH_005);

    const role = await this.adminUserRepository.findRoleByName(dto.role ?? 'member');
    if (!role) throw new Error("Role not seeded — run 'npm run seed'");

    const passwordHash = await hashPassword(dto.password);
    const user = this.adminUserRepository.create({
      email: dto.email,
      passwordHash,
      fullName: dto.fullName,
      timezone: dto.timezone || 'Asia/Ho_Chi_Minh',
      roleId: role.id,
      role,
    });
    const saved = await this.adminUserRepository.save(user);
    return toUserResponse(saved);
  }

  async update(id: number, dto: UpdateUserDto): Promise<UserResponse> {
    const user = await this.getUserOrThrow(id);
    if (dto.fullName !== undefined) user.fullName = dto.fullName;
    if (dto.avatarUrl !== undefined) user.avatarUrl = dto.avatarUrl;
    if (dto.timezone !== undefined) user.timezone = dto.timezone;
    const saved = await this.adminUserRepository.save(user);
    return toUserResponse(saved);
  }

  async updateRole(admin: JwtPayload, id: number, dto: UpdateRoleDto): Promise<UserResponse> {
    // Rule #1: admin cannot change their own role (prevents self-lockout).
    if (Number(admin.id) === id) throw new AppException(ERROR_CODES.USER_002);

    const user = await this.getUserOrThrow(id);
    const oldRoleName = user.role.name;
    if (oldRoleName === dto.role) return toUserResponse(user);

    // Rule #2: can't demote the last admin.
    if (oldRoleName === 'admin' && dto.role === 'member') {
      const adminCount = await this.adminUserRepository.countAdmins();
      if (adminCount <= 1) throw new AppException(ERROR_CODES.USER_005);
    }

    const role = await this.adminUserRepository.findRoleByName(dto.role);
    if (!role) throw new Error("Role not seeded — run 'npm run seed'");

    const saved = await this.dataSource.transaction(async (manager) => {
      user.roleId = role.id;
      user.role = role;
      const updated = await manager.getRepository(User).save(user);
      await this.activityLogger.log(manager, {
        taskId: null,
        userId: admin.id,
        action: 'updated',
        taskTitle: `Đổi role người dùng #${id}`,
        fieldName: 'role',
        oldValue: oldRoleName,
        newValue: dto.role,
        metadata: { targetUserId: id },
      });
      return updated;
    });

    // Rule #3: revoke every session, force re-login with the new role.
    await this.refreshTokenRepository.revokeAllByUserId(id);
    return toUserResponse(saved);
  }

  async updateStatus(admin: JwtPayload, id: number, dto: UpdateStatusDto): Promise<UserResponse> {
    // Rule: admin cannot deactivate their own account.
    if (Number(admin.id) === id) throw new AppException(ERROR_CODES.USER_003);

    const user = await this.getUserOrThrow(id);
    const oldStatus = user.isActive;

    const saved = await this.dataSource.transaction(async (manager) => {
      user.isActive = dto.isActive;
      const updated = await manager.getRepository(User).save(user);
      await this.activityLogger.log(manager, {
        taskId: null,
        userId: admin.id,
        action: 'updated',
        taskTitle: `${dto.isActive ? 'Mở khoá' : 'Khoá'} người dùng #${id}`,
        fieldName: 'isActive',
        oldValue: String(oldStatus),
        newValue: String(dto.isActive),
        metadata: { targetUserId: id },
      });
      return updated;
    });

    if (!dto.isActive) await this.refreshTokenRepository.revokeAllByUserId(id);
    return toUserResponse(saved);
  }

  async resetPassword(admin: JwtPayload, id: number, dto: ResetPasswordDto): Promise<void> {
    const user = await this.getUserOrThrow(id);
    user.passwordHash = await hashPassword(dto.newPassword);

    await this.dataSource.transaction(async (manager) => {
      await manager.getRepository(User).save(user);
      await this.activityLogger.log(manager, {
        taskId: null,
        userId: admin.id,
        action: 'updated',
        taskTitle: `Đặt lại mật khẩu người dùng #${id}`,
        fieldName: 'password',
        metadata: { targetUserId: id },
      });
    });

    await this.refreshTokenRepository.revokeAllByUserId(id);
  }

  async remove(admin: JwtPayload, id: number): Promise<void> {
    if (Number(admin.id) === id) throw new AppException(ERROR_CODES.USER_003);

    const user = await this.getUserOrThrow(id);
    if (user.role.name === 'admin') {
      const adminCount = await this.adminUserRepository.countAdmins();
      if (adminCount <= 1) throw new AppException(ERROR_CODES.USER_005);
    }

    await this.dataSource.transaction(async (manager) => {
      user.isActive = false;
      await manager.getRepository(User).save(user);
      await this.activityLogger.log(manager, {
        taskId: null,
        userId: admin.id,
        action: 'archived',
        taskTitle: `Xoá (soft) người dùng #${id}`,
        metadata: { targetUserId: id },
      });
    });

    await this.refreshTokenRepository.revokeAllByUserId(id);
  }

  private async getUserOrThrow(id: number): Promise<User> {
    const user = await this.adminUserRepository.findById(id);
    if (!user) throw new AppException(ERROR_CODES.USER_001);
    return user;
  }

  private async getTaskStats(userId: number): Promise<TaskStatsSummary> {
    const [total, completed] = await Promise.all([
      this.taskRepo.createQueryBuilder('task').where('task.assigneeId = :userId', { userId }).getCount(),
      this.taskRepo
        .createQueryBuilder('task')
        .where('task.assigneeId = :userId', { userId })
        .andWhere('task.status = :status', { status: TaskStatus.DONE })
        .getCount(),
    ]);
    return { total, completed };
  }
}
