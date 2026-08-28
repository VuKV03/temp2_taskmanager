import { Injectable } from '@nestjs/common';
import { AppException } from '../../../shared/exceptions/app.exception.js';
import { ERROR_CODES } from '../../../shared/constants/error-codes.constant.js';
import type { JwtPayload } from '../../../shared/decorators/current-user.decorator.js';
import { TaskRepository } from '../../task/repositories/task.repository.js';
import { StorageService } from '../../../core/storage/storage.service.js';
import { AttachmentRepository } from '../repositories/attachment.repository.js';
import {
  ALLOWED_ATTACHMENT_MIME_TYPES,
  MAX_ATTACHMENT_SIZE_BYTES,
  MAX_ATTACHMENTS_PER_REQUEST,
  toAttachmentResponse,
} from '../types/collaboration.types.js';
import type { AttachmentResponse } from '../types/collaboration.types.js';

export interface UploadedFile {
  buffer: Buffer;
  originalname: string;
  mimetype: string;
  size: number;
}

@Injectable()
export class AttachmentService {
  constructor(
    private readonly attachmentRepository: AttachmentRepository,
    private readonly taskRepository: TaskRepository,
    private readonly storageService: StorageService,
  ) {}

  async findByTask(taskId: number, user: JwtPayload): Promise<AttachmentResponse[]> {
    await this.getAccessibleTask(taskId, user);
    const attachments = await this.attachmentRepository.findByTask(taskId);
    return attachments.map(toAttachmentResponse);
  }

  async upload(taskId: number, user: JwtPayload, files: UploadedFile[]): Promise<AttachmentResponse[]> {
    await this.getAccessibleTask(taskId, user);

    if (files.length === 0) {
      throw new AppException(ERROR_CODES.SYS_002, undefined, { files: ['At least one file is required'] });
    }
    if (files.length > MAX_ATTACHMENTS_PER_REQUEST) {
      throw new AppException(ERROR_CODES.FILE_002, undefined, {
        files: [`Maximum ${MAX_ATTACHMENTS_PER_REQUEST} files per request`],
      });
    }
    for (const file of files) {
      if (file.size > MAX_ATTACHMENT_SIZE_BYTES) throw new AppException(ERROR_CODES.FILE_002);
      if (!ALLOWED_ATTACHMENT_MIME_TYPES.includes(file.mimetype)) throw new AppException(ERROR_CODES.FILE_003);
    }

    const uploaded = await Promise.all(
      files.map(async (file) => {
        const stored = await this.storageService.upload({
          buffer: file.buffer,
          originalName: file.originalname,
          mimeType: file.mimetype,
        });
        return this.attachmentRepository.create({
          taskId,
          uploadedBy: user.id,
          fileUrl: stored.url,
          fileName: file.originalname,
          fileSize: file.size,
          mimeType: file.mimetype,
        });
      }),
    );

    const saved = await this.attachmentRepository.saveMany(uploaded);
    const full = await Promise.all(saved.map((a) => this.attachmentRepository.findById(a.id)));
    return full.map((a) => toAttachmentResponse(a!));
  }

  async delete(attachmentId: number, user: JwtPayload): Promise<void> {
    const attachment = await this.attachmentRepository.findById(attachmentId);
    if (!attachment) throw new AppException(ERROR_CODES.FILE_001);

    const task = await this.taskRepository.findByIdBare(attachment.taskId);
    const isUploader = attachment.uploadedBy === user.id;
    const isTaskOwner = !!task && (task.creatorId === user.id || task.assigneeId === user.id);
    if (!isUploader && !isTaskOwner && user.role !== 'admin') {
      throw new AppException(ERROR_CODES.TASK_002);
    }

    await this.storageService.delete(attachment.fileUrl);
    await this.attachmentRepository.delete(attachmentId);
  }

  private async getAccessibleTask(taskId: number, user: JwtPayload) {
    const task = await this.taskRepository.findByIdBare(taskId);
    if (!task) throw new AppException(ERROR_CODES.TASK_001);
    const isOwner = task.creatorId === user.id || task.assigneeId === user.id;
    if (!isOwner && user.role !== 'admin') throw new AppException(ERROR_CODES.TASK_002);
    return task;
  }
}
