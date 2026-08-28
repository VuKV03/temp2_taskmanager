import {
  Controller,
  Get,
  Post,
  Param,
  ParseIntPipe,
  UseInterceptors,
  UploadedFiles,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { FilesInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiConsumes } from '@nestjs/swagger';
import { CurrentUser } from '../../../shared/decorators/current-user.decorator.js';
import type { JwtPayload } from '../../../shared/decorators/current-user.decorator.js';
import { AttachmentService } from '../services/attachment.service.js';
import { MAX_ATTACHMENTS_PER_REQUEST } from '../types/collaboration.types.js';
import type { UploadedFile } from '../services/attachment.service.js';

@ApiTags('attachments')
@ApiBearerAuth('access-token')
@Controller('tasks/:id/attachments')
export class TaskAttachmentController {
  constructor(private readonly attachmentService: AttachmentService) {}

  @Get()
  @ApiOperation({ summary: 'List files attached to a task' })
  findByTask(@Param('id', ParseIntPipe) taskId: number, @CurrentUser() user: JwtPayload) {
    return this.attachmentService.findByTask(taskId, user);
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiConsumes('multipart/form-data')
  @ApiOperation({ summary: 'Upload one or more files (field name: files)' })
  @UseInterceptors(FilesInterceptor('files', MAX_ATTACHMENTS_PER_REQUEST))
  upload(
    @Param('id', ParseIntPipe) taskId: number,
    @CurrentUser() user: JwtPayload,
    @UploadedFiles() files: UploadedFile[],
  ) {
    return this.attachmentService.upload(taskId, user, files ?? []);
  }
}
