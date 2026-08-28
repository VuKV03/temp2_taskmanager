import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Task } from '../task/entities/task.entity.js';
import { StatsRepository } from './repositories/stats.repository.js';
import { StatsService } from './services/stats.service.js';
import { StatsController } from './controllers/stats.controller.js';
import { AdminStatsController } from './controllers/admin-stats.controller.js';

/**
 * Read-only (DATABASE.md: `user_daily_stats` is optional, "for performance").
 * This feature always computes live via `GROUP BY` on `tasks` — no cron
 * populates an aggregate table, so the API_SPEC.md ">90 days uses
 * user_daily_stats" optimization is intentionally skipped (dev/demo scale).
 * `Task` registered directly (not via `TaskModule`) since only its raw
 * repository is needed — same reasoning as `activity`.
 */
@Module({
  imports: [TypeOrmModule.forFeature([Task])],
  controllers: [StatsController, AdminStatsController],
  providers: [StatsRepository, StatsService],
})
export class StatisticModule {}
