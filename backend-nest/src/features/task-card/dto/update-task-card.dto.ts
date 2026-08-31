import { PartialType } from '@nestjs/swagger';
import { CreateTaskCardDto } from './create-task-card.dto.js';

export class UpdateTaskCardDto extends PartialType(CreateTaskCardDto) {}
