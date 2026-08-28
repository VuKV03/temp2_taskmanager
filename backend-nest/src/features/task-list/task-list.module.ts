import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TaskList } from './entities/task-list.entity.js';
import { TaskListRepository } from './repositories/task-list.repository.js';
import { TaskListService } from './task-list.service.js';
import { TaskListController } from './task-list.controller.js';

@Module({
  imports: [TypeOrmModule.forFeature([TaskList])],
  controllers: [TaskListController],
  providers: [TaskListService, TaskListRepository],
  exports: [TypeOrmModule, TaskListRepository],
})
export class TaskListModule {}
