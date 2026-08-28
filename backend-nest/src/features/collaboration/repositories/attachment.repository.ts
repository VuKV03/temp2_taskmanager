import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TaskAttachment } from '../entities/task-attachment.entity.js';

@Injectable()
export class AttachmentRepository {
  constructor(
    @InjectRepository(TaskAttachment)
    private readonly repo: Repository<TaskAttachment>,
  ) {}

  findByTask(taskId: number): Promise<TaskAttachment[]> {
    return this.repo.find({
      where: { taskId },
      relations: { uploader: true },
      order: { createdAt: 'DESC' },
    });
  }

  findById(id: number): Promise<TaskAttachment | null> {
    return this.repo.findOne({ where: { id }, relations: { uploader: true } });
  }

  create(data: Partial<TaskAttachment>): TaskAttachment {
    return this.repo.create(data);
  }

  save(attachment: TaskAttachment): Promise<TaskAttachment> {
    return this.repo.save(attachment);
  }

  saveMany(attachments: TaskAttachment[]): Promise<TaskAttachment[]> {
    return this.repo.save(attachments);
  }

  async delete(id: number): Promise<void> {
    await this.repo.delete({ id });
  }
}
