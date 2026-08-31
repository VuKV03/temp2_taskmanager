import { Injectable } from '@nestjs/common';
import { InjectRepository, InjectDataSource } from '@nestjs/typeorm';
import { DataSource, In, Repository } from 'typeorm';
import { TaskCard } from '../entities/task-card.entity.js';

@Injectable()
export class TaskCardRepository {
  constructor(
    @InjectRepository(TaskCard)
    private readonly repo: Repository<TaskCard>,
    // Only used for the raw task-count query below — see comment there,
    // same escape hatch as `task-list`'s `countActiveTasks`.
    @InjectDataSource()
    private readonly dataSource: DataSource,
  ) {}

  findByOwner(ownerId: number): Promise<TaskCard[]> {
    return this.repo.find({ where: { ownerId }, order: { sortOrder: 'ASC', createdAt: 'ASC' } });
  }

  findById(id: number): Promise<TaskCard | null> {
    return this.repo.findOne({ where: { id } });
  }

  findByIds(ids: number[]): Promise<TaskCard[]> {
    return this.repo.find({ where: { id: In(ids) } });
  }

  create(data: Partial<TaskCard>): TaskCard {
    return this.repo.create(data);
  }

  save(card: TaskCard): Promise<TaskCard> {
    return this.repo.save(card);
  }

  async delete(id: number): Promise<void> {
    await this.repo.delete({ id });
  }

  /**
   * `task` depends on `task-card` (not the other way round), so this queries
   * the `tasks` table directly by name instead of importing the Task
   * entity/repository, to avoid a circular module dependency — same
   * reasoning as `task-list.repository.ts`'s `countActiveTasks`.
   */
  async countsForCards(cardIds: number[]): Promise<Map<number, number>> {
    const result = new Map<number, number>();
    if (cardIds.length === 0) return result;

    const rows = await this.dataSource.query(
      `SELECT card_id, COUNT(*) as count FROM tasks WHERE card_id IN (${cardIds.map(() => '?').join(',')}) AND is_archived = 0 GROUP BY card_id`,
      cardIds,
    );
    for (const row of rows) {
      result.set(Number(row.card_id), Number(row.count));
    }
    return result;
  }
}
