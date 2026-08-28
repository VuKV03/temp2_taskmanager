import { Injectable, HttpStatus } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { AppException } from '../../../shared/exceptions/app.exception.js';
import { ERROR_CODES } from '../../../shared/constants/error-codes.constant.js';
import type { JwtPayload } from '../../../shared/decorators/current-user.decorator.js';
import { ActivityLoggerService } from '../../activity/services/activity-logger.service.js';
import type { TaskAssignedEvent } from '../../notification/types/notification-events.types.js';
import { TaskListRepository } from '../../task-list/repositories/task-list.repository.js';
import { UserRepository } from '../../auth/repositories/user.repository.js';
import { TaskRepository } from '../repositories/task.repository.js';
import { TagRepository } from '../repositories/tag.repository.js';
import { Task } from '../entities/task.entity.js';
import { CreateTaskDto } from '../dto/create-task.dto.js';
import { UpdateTaskDto } from '../dto/update-task.dto.js';
import { QueryTaskDto } from '../dto/query-task.dto.js';
import { ReorderTasksDto } from '../dto/reorder-tasks.dto.js';
import { toTaskResponse } from '../types/task.types.js';
import type { TaskResponse } from '../types/task.types.js';
import type { PaginatedMeta } from '../../../shared/dto/pagination-query.dto.js';

@Injectable()
export class TaskService {
  constructor(
    @InjectDataSource() private readonly dataSource: DataSource,
    private readonly taskRepository: TaskRepository,
    private readonly tagRepository: TagRepository,
    private readonly taskListRepository: TaskListRepository,
    private readonly userRepository: UserRepository,
    private readonly activityLogger: ActivityLoggerService,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  async findMany(user: JwtPayload, query: QueryTaskDto): Promise<{ data: TaskResponse[]; meta: PaginatedMeta }> {
    const { items, total } = await this.taskRepository.findMany(user.id, query);
    const responses = await this.attachSubtaskCounts(items);
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    return { data: responses, meta: { page, limit, total, totalPages: Math.ceil(total / limit) || 0 } };
  }

  async findOne(user: JwtPayload, id: number): Promise<TaskResponse> {
    const task = await this.getAccessibleTask(user, id);
    // Only the detail endpoint needs the actual subtask rows (UI-SPEC.md
    // drawer checklist) — list/today views only need the counts.
    const subtasks = task.parentTaskId === null ? await this.taskRepository.findSubtasks(task.id) : [];
    const counts = await this.taskRepository.getSubtaskCounts([task.id]);
    return toTaskResponse(task, counts.get(Number(task.id)), subtasks);
  }

  async create(user: JwtPayload, dto: CreateTaskDto): Promise<TaskResponse> {
    let listId = dto.listId ?? null;
    let parent: Task | null = null;

    if (dto.parentTaskId !== undefined) {
      parent = await this.taskRepository.findByIdBare(dto.parentTaskId);
      if (!parent) throw new AppException(ERROR_CODES.TASK_001);
      if (parent.parentTaskId !== null) throw new AppException(ERROR_CODES.TASK_004);
      this.assertTaskAccess(user, parent);
      // Subtasks inherit the parent's list (business rule #5).
      listId = parent.listId;
    } else if (listId !== null) {
      const list = await this.taskListRepository.findById(listId);
      if (!list || list.ownerId !== user.id) {
        throw new AppException(ERROR_CODES.LIST_002);
      }
    }

    const assigneeId = await this.resolveAssignee(user, dto.assigneeId);

    if (dto.recurrenceRule && !dto.dueDate) {
      throw new AppException(ERROR_CODES.SYS_002, HttpStatus.BAD_REQUEST, {
        dueDate: ['dueDate is required when recurrenceRule is set'],
      });
    }

    const tags = dto.tagIds?.length ? await this.resolveTags(user.id, dto.tagIds) : [];

    const saved = await this.dataSource.transaction(async (manager) => {
      const task = manager.getRepository(Task).create({
        title: dto.title,
        description: dto.description ?? null,
        listId,
        parentTaskId: dto.parentTaskId ?? null,
        creatorId: user.id,
        assigneeId,
        priority: dto.priority,
        startDate: dto.startDate ? new Date(dto.startDate) : null,
        dueDate: dto.dueDate ? new Date(dto.dueDate) : null,
        estimateMinutes: dto.estimateMinutes ?? null,
        recurrenceRule: dto.recurrenceRule ?? null,
        tags,
      });
      const savedTask = await manager.getRepository(Task).save(task);

      await this.activityLogger.log(manager, {
        taskId: savedTask.id,
        userId: user.id,
        action: 'created',
        taskTitle: savedTask.title,
      });

      return savedTask;
    });

    const full = await this.taskRepository.findById(saved.id);
    return toTaskResponse(full!);
  }

  async update(user: JwtPayload, id: number, dto: UpdateTaskDto): Promise<TaskResponse> {
    const task = await this.getAccessibleTask(user, id);

    if (dto.listId !== undefined) {
      if (dto.listId !== null) {
        const list = await this.taskListRepository.findById(dto.listId);
        if (!list || list.ownerId !== user.id) {
          throw new AppException(ERROR_CODES.LIST_002);
        }
      }
      task.listId = dto.listId;
    }
    if (dto.title !== undefined) task.title = dto.title;
    if (dto.description !== undefined) task.description = dto.description;
    if (dto.priority !== undefined) task.priority = dto.priority;
    if (dto.startDate !== undefined) task.startDate = dto.startDate ? new Date(dto.startDate) : null;
    if (dto.dueDate !== undefined) task.dueDate = dto.dueDate ? new Date(dto.dueDate) : null;
    if (dto.estimateMinutes !== undefined) task.estimateMinutes = dto.estimateMinutes;
    if (dto.recurrenceRule !== undefined) task.recurrenceRule = dto.recurrenceRule;
    if (dto.tagIds !== undefined) task.tags = await this.resolveTags(user.id, dto.tagIds);

    if (task.recurrenceRule && !task.dueDate) {
      throw new AppException(ERROR_CODES.SYS_002, HttpStatus.BAD_REQUEST, {
        dueDate: ['dueDate is required when recurrenceRule is set'],
      });
    }

    const saved = await this.dataSource.transaction(async (manager) => {
      const updated = await manager.getRepository(Task).save(task);
      await this.activityLogger.log(manager, {
        taskId: updated.id,
        userId: user.id,
        action: 'updated',
        taskTitle: updated.title,
      });
      return updated;
    });

    const full = await this.taskRepository.findById(saved.id);
    return toTaskResponse(full!);
  }

  async archive(user: JwtPayload, id: number): Promise<void> {
    const task = await this.getAccessibleTask(user, id);
    await this.dataSource.transaction(async (manager) => {
      task.isArchived = true;
      await manager.getRepository(Task).save(task);
      await this.activityLogger.log(manager, {
        taskId: task.id,
        userId: user.id,
        action: 'archived',
        taskTitle: task.title,
      });
    });
  }

  async reorder(user: JwtPayload, dto: ReorderTasksDto): Promise<TaskResponse[]> {
    const ids = dto.items.map((item) => item.id);
    const tasks = await this.taskRepository.findByIds(ids);
    // `id` comes back from mysql2 as a string (bigint), while `item.id` is a
    // real number after DTO validation/transform — normalize both to number
    // so the Map lookup below actually matches.
    const owned = new Map(
      tasks
        .filter((t) => t.creatorId === user.id || t.assigneeId === user.id)
        .map((t) => [Number(t.id), t]),
    );
    for (const item of dto.items) {
      const task = owned.get(item.id);
      if (!task) throw new AppException(ERROR_CODES.TASK_001);
      task.sortOrder = item.sortOrder;
    }
    const saved = await this.taskRepository.saveMany([...owned.values()]);
    // `save()` doesn't return joined relations — re-fetch so the mapper
    // below (which needs task.creator etc.) doesn't crash.
    const full = await this.taskRepository.findByIdsWithRelations(saved.map((t) => t.id));
    const bySortOrder = new Map(full.map((t) => [Number(t.id), t]));
    const ordered = saved
      .map((t) => bySortOrder.get(Number(t.id))!)
      .sort((a, b) => a.sortOrder - b.sortOrder);
    const responses = await this.attachSubtaskCounts(ordered);
    return responses;
  }

  async assign(user: JwtPayload, id: number, assigneeId: number): Promise<TaskResponse> {
    // Controller enforces @Roles('admin') — this endpoint is admin-only.
    const task = await this.taskRepository.findByIdBare(id);
    if (!task) throw new AppException(ERROR_CODES.TASK_001);

    const assignee = await this.userRepository.findById(assigneeId);
    if (!assignee || !assignee.isActive) {
      throw new AppException(ERROR_CODES.TASK_006);
    }

    const saved = await this.dataSource.transaction(async (manager) => {
      const oldAssigneeId = task.assigneeId;
      task.assigneeId = assigneeId;
      const updated = await manager.getRepository(Task).save(task);
      await this.activityLogger.log(manager, {
        taskId: updated.id,
        userId: user.id,
        action: 'assigned',
        taskTitle: updated.title,
        fieldName: 'assigneeId',
        oldValue: oldAssigneeId ? String(oldAssigneeId) : null,
        newValue: String(assigneeId),
      });
      return updated;
    });

    const full = await this.taskRepository.findById(saved.id);

    // Fire-and-forget — notification is non-critical (CONTEXT.md: "loss is
    // acceptable"), so this happens after the transaction commits and isn't
    // awaited into it. `notification` listens for this; `task` never
    // imports `notification` (see EventEmitterModule in app.module.ts).
    this.eventEmitter.emit('task.assigned', {
      userId: assigneeId,
      taskId: full!.id,
      taskTitle: full!.title,
    } satisfies TaskAssignedEvent);

    return toTaskResponse(full!);
  }

  // Admin: system-wide listing / hard delete.
  async adminFindMany(query: QueryTaskDto): Promise<{ data: TaskResponse[]; meta: PaginatedMeta }> {
    const { items, total } = await this.taskRepository.adminFindMany(query);
    const responses = await this.attachSubtaskCounts(items);
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    return { data: responses, meta: { page, limit, total, totalPages: Math.ceil(total / limit) || 0 } };
  }

  async adminHardDelete(id: number): Promise<void> {
    const task = await this.taskRepository.findByIdBare(id);
    if (!task) throw new AppException(ERROR_CODES.TASK_001);
    await this.taskRepository.hardDelete(id);
  }

  /** Loaded + ownership-checked task, for endpoints scoped to "my tasks". */
  async getAccessibleTask(user: JwtPayload, id: number): Promise<Task> {
    const task = await this.taskRepository.findById(id);
    if (!task) throw new AppException(ERROR_CODES.TASK_001);
    this.assertTaskAccess(user, task);
    return task;
  }

  private assertTaskAccess(user: JwtPayload, task: Task): void {
    const isOwner = task.creatorId === user.id || task.assigneeId === user.id;
    if (!isOwner && user.role !== 'admin') {
      throw new AppException(ERROR_CODES.TASK_002);
    }
  }

  private async resolveAssignee(user: JwtPayload, requestedAssigneeId: number | undefined): Promise<number> {
    // `user.id` comes from the JWT payload, which was signed from a bigint
    // entity id — it's a numeric string at runtime even though the type
    // says `number`. Normalize before comparing to the DTO's real number.
    if (requestedAssigneeId === undefined || requestedAssigneeId === Number(user.id)) {
      return Number(user.id);
    }
    if (user.role !== 'admin') {
      throw new AppException(ERROR_CODES.AUTH_004);
    }
    const assignee = await this.userRepository.findById(requestedAssigneeId);
    if (!assignee || !assignee.isActive) {
      throw new AppException(ERROR_CODES.TASK_006);
    }
    return requestedAssigneeId;
  }

  private async resolveTags(userId: number, tagIds: number[]) {
    if (tagIds.length === 0) return [];
    const tags = await this.tagRepository.findAccessibleByIds(userId, tagIds);
    if (tags.length !== tagIds.length) {
      throw new AppException(ERROR_CODES.TAG_001);
    }
    return tags;
  }

  private async attachSubtaskCounts(tasks: Task[]): Promise<TaskResponse[]> {
    const counts = await this.taskRepository.getSubtaskCounts(tasks.map((t) => t.id));
    return tasks.map((task) => toTaskResponse(task, counts.get(Number(task.id))));
  }
}
