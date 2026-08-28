import { Injectable } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { AppException } from '../../../shared/exceptions/app.exception.js';
import { ERROR_CODES } from '../../../shared/constants/error-codes.constant.js';
import type { JwtPayload } from '../../../shared/decorators/current-user.decorator.js';
import { TagRepository } from '../repositories/tag.repository.js';
import { TaskRepository } from '../repositories/task.repository.js';
import { Task } from '../entities/task.entity.js';
import { Tag } from '../entities/tag.entity.js';
import { CreateTagDto } from '../dto/create-tag.dto.js';
import { UpdateTagDto } from '../dto/update-tag.dto.js';
import type { TagSummary } from '../types/task.types.js';

function toTagSummary(tag: { id: number; name: string; color: string | null }): TagSummary {
  return { id: tag.id, name: tag.name, color: tag.color };
}

@Injectable()
export class TaskTagService {
  constructor(
    @InjectDataSource() private readonly dataSource: DataSource,
    private readonly tagRepository: TagRepository,
    private readonly taskRepository: TaskRepository,
  ) {}

  async findAll(user: JwtPayload): Promise<TagSummary[]> {
    const tags = await this.tagRepository.findForUser(user.id);
    return tags.map(toTagSummary);
  }

  async create(user: JwtPayload, dto: CreateTagDto): Promise<TagSummary> {
    const existing = await this.tagRepository.findByOwnerAndName(user.id, dto.name);
    if (existing) {
      throw new AppException(ERROR_CODES.TAG_002);
    }
    const tag = this.tagRepository.create({ userId: user.id, name: dto.name, color: dto.color ?? null });
    const saved = await this.tagRepository.save(tag);
    return toTagSummary(saved);
  }

  async update(user: JwtPayload, id: number, dto: UpdateTagDto): Promise<TagSummary> {
    const tag = await this.getEditableTag(user, id);
    if (dto.name !== undefined && dto.name !== tag.name) {
      const existing = await this.tagRepository.findByOwnerAndName(tag.userId, dto.name);
      if (existing && existing.id !== tag.id) {
        throw new AppException(ERROR_CODES.TAG_002);
      }
      tag.name = dto.name;
    }
    if (dto.color !== undefined) tag.color = dto.color;
    const saved = await this.tagRepository.save(tag);
    return toTagSummary(saved);
  }

  async remove(user: JwtPayload, id: number): Promise<void> {
    const tag = await this.getEditableTag(user, id);
    await this.dataSource.transaction(async (manager) => {
      // Explicit junction cleanup — reliable regardless of ORM cascade
      // configuration on the ManyToMany relation.
      await manager.query('DELETE FROM task_tags WHERE tag_id = ?', [tag.id]);
      await manager.getRepository(Tag).delete({ id: tag.id });
    });
  }

  async replaceTaskTags(user: JwtPayload, taskId: number, tagIds: number[]): Promise<TagSummary[]> {
    const task = await this.taskRepository.findByIdBare(taskId);
    if (!task) throw new AppException(ERROR_CODES.TASK_001);
    const isOwner = task.creatorId === user.id || task.assigneeId === user.id;
    if (!isOwner && user.role !== 'admin') {
      throw new AppException(ERROR_CODES.TASK_002);
    }

    const tags = tagIds.length ? await this.tagRepository.findAccessibleByIds(user.id, tagIds) : [];
    if (tags.length !== tagIds.length) {
      throw new AppException(ERROR_CODES.TAG_001);
    }

    await this.dataSource.transaction(async (manager) => {
      const repo = manager.getRepository(Task);
      const full = await repo.findOne({ where: { id: taskId }, relations: { tags: true } });
      full!.tags = tags;
      await repo.save(full!);
    });

    return tags.map(toTagSummary);
  }

  private async getEditableTag(user: JwtPayload, id: number) {
    const tag = await this.tagRepository.findById(id);
    if (!tag) throw new AppException(ERROR_CODES.TAG_001);
    const isOwnPersonalTag = tag.userId === user.id;
    const isSystemTagEditableByAdmin = tag.userId === null && user.role === 'admin';
    if (!isOwnPersonalTag && !isSystemTagEditableByAdmin) {
      // Hide existence rather than exposing a 403 for another user's tag.
      throw new AppException(ERROR_CODES.TAG_001);
    }
    return tag;
  }
}
