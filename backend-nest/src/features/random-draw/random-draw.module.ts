import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DrawSession } from './entities/draw-session.entity.js';
import { DrawItem } from './entities/draw-item.entity.js';
import { DrawSessionRepository } from './repositories/draw-session.repository.js';
import { DrawItemRepository } from './repositories/draw-item.repository.js';
import { RandomDrawService } from './random-draw.service.js';
import { RandomDrawController } from './random-draw.controller.js';
import { TaskListModule } from '../task-list/task-list.module.js';
import { TaskModule } from '../task/task.module.js';

@Module({
  imports: [
    TypeOrmModule.forFeature([DrawSession, DrawItem]),
    TaskListModule, // TaskListRepository — ownership check when pooling from a real list
    TaskModule, // TaskRepository — snapshotting a list's tasks into the pool
  ],
  controllers: [RandomDrawController],
  providers: [DrawSessionRepository, DrawItemRepository, RandomDrawService],
})
export class RandomDrawModule {}
