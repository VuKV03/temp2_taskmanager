import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TaskCard } from './entities/task-card.entity.js';
import { TaskCardRepository } from './repositories/task-card.repository.js';
import { TaskCardService } from './task-card.service.js';
import { TaskCardController } from './task-card.controller.js';

@Module({
  imports: [TypeOrmModule.forFeature([TaskCard])],
  controllers: [TaskCardController],
  providers: [TaskCardService, TaskCardRepository],
  exports: [TypeOrmModule, TaskCardRepository],
})
export class TaskCardModule {}
