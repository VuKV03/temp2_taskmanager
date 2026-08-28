import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TaskComment } from '../entities/task-comment.entity.js';

@Injectable()
export class CommentRepository {
  constructor(
    @InjectRepository(TaskComment)
    private readonly repo: Repository<TaskComment>,
  ) {}

  findByTask(taskId: number): Promise<TaskComment[]> {
    return this.repo.find({
      where: { taskId },
      relations: { user: true },
      order: { createdAt: 'ASC' },
    });
  }

  findById(id: number): Promise<TaskComment | null> {
    return this.repo.findOne({ where: { id }, relations: { user: true } });
  }

  create(data: Partial<TaskComment>): TaskComment {
    return this.repo.create(data);
  }

  save(comment: TaskComment): Promise<TaskComment> {
    return this.repo.save(comment);
  }

  async delete(id: number): Promise<void> {
    await this.repo.delete({ id });
  }
}
