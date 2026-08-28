import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { AppException } from '../../shared/exceptions/app.exception.js';
import { ERROR_CODES } from '../../shared/constants/error-codes.constant.js';
import type { JwtPayload } from '../../shared/decorators/current-user.decorator.js';
import { TaskListRepository } from './repositories/task-list.repository.js';
import { CreateTaskListDto } from './dto/create-task-list.dto.js';
import { UpdateTaskListDto } from './dto/update-task-list.dto.js';
import { ReorderListsDto } from './dto/reorder-lists.dto.js';
import { toTaskListResponse } from './types/task-list.types.js';
import type { TaskListResponse, TaskListDetailResponse } from './types/task-list.types.js';

const DEFAULT_LIST_NAME = 'Cá nhân';

@Injectable()
export class TaskListService {
  private readonly logger = new Logger(TaskListService.name);

  constructor(private readonly taskListRepository: TaskListRepository) {}

  async findAll(user: JwtPayload, includeArchived: boolean): Promise<TaskListResponse[]> {
    const lists = await this.taskListRepository.findByOwner(user.id, includeArchived);
    return lists.map(toTaskListResponse);
  }

  async findOne(user: JwtPayload, id: number): Promise<TaskListDetailResponse> {
    const list = await this.getOwnedList(user, id);
    const taskCount = await this.taskListRepository.countActiveTasks(list.id);
    return { ...toTaskListResponse(list), taskCount };
  }

  async create(user: JwtPayload, dto: CreateTaskListDto): Promise<TaskListResponse> {
    const existing = await this.taskListRepository.findByOwnerAndName(user.id, dto.name);
    if (existing) {
      throw new AppException(ERROR_CODES.LIST_003);
    }
    const list = this.taskListRepository.create({
      ownerId: user.id,
      name: dto.name,
      description: dto.description ?? null,
      color: dto.color ?? null,
      sortOrder: 0,
    });
    const saved = await this.taskListRepository.save(list);
    return toTaskListResponse(saved);
  }

  async update(user: JwtPayload, id: number, dto: UpdateTaskListDto): Promise<TaskListResponse> {
    const list = await this.getOwnedList(user, id);

    if (dto.name !== undefined && dto.name !== list.name) {
      const existing = await this.taskListRepository.findByOwnerAndName(user.id, dto.name);
      if (existing && existing.id !== list.id) {
        throw new AppException(ERROR_CODES.LIST_003);
      }
      list.name = dto.name;
    }
    if (dto.description !== undefined) list.description = dto.description;
    if (dto.color !== undefined) list.color = dto.color;

    const saved = await this.taskListRepository.save(list);
    return toTaskListResponse(saved);
  }

  async archive(user: JwtPayload, id: number): Promise<void> {
    const list = await this.getOwnedList(user, id);
    list.isArchived = true;
    await this.taskListRepository.save(list);
  }

  async reorder(user: JwtPayload, dto: ReorderListsDto): Promise<TaskListResponse[]> {
    const ids = dto.items.map((item) => item.id);
    const lists = await this.taskListRepository.findByIds(ids);

    // `id` comes back from mysql2 as a string (bigint), while `item.id` is a
    // real number after DTO validation/transform — normalize both to number
    // so the Map lookup below actually matches.
    const owned = new Map(lists.filter((l) => l.ownerId === user.id).map((l) => [Number(l.id), l]));
    for (const item of dto.items) {
      const list = owned.get(item.id);
      if (!list) {
        throw new AppException(ERROR_CODES.LIST_001);
      }
      list.sortOrder = item.sortOrder;
    }

    const saved = await this.taskListRepository.saveMany([...owned.values()]);
    return saved.sort((a, b) => a.sortOrder - b.sortOrder).map(toTaskListResponse);
  }

  private async getOwnedList(user: JwtPayload, id: number) {
    const list = await this.taskListRepository.findById(id);
    if (!list) {
      throw new AppException(ERROR_CODES.LIST_001);
    }
    if (list.ownerId !== user.id) {
      throw new AppException(ERROR_CODES.LIST_002);
    }
    return list;
  }

  /**
   * Listens for `user.registered` (emitted by `auth`) to create the
   * default "Cá nhân" list — see API_SPEC.md POST /auth/register business
   * logic #3. Decoupled via EventEmitter2 so `task-list` never imports
   * `auth`'s service directly for this.
   */
  @OnEvent('user.registered')
  async handleUserRegistered(payload: { userId: number }): Promise<void> {
    try {
      const list = this.taskListRepository.create({
        ownerId: payload.userId,
        name: DEFAULT_LIST_NAME,
        sortOrder: 0,
      });
      await this.taskListRepository.save(list);
    } catch (error) {
      // Non-critical — user can create lists manually. Don't let this
      // break registration.
      this.logger.error(`Failed to create default list for user ${payload.userId}`, error);
    }
  }
}
