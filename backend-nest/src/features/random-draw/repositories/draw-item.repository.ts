import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { DrawItem } from '../entities/draw-item.entity.js';

@Injectable()
export class DrawItemRepository {
  constructor(
    @InjectRepository(DrawItem)
    private readonly repo: Repository<DrawItem>,
  ) {}

  createMany(items: Partial<DrawItem>[]): DrawItem[] {
    return this.repo.create(items);
  }

  saveMany(items: DrawItem[]): Promise<DrawItem[]> {
    return this.repo.save(items);
  }

  findBySession(sessionId: number): Promise<DrawItem[]> {
    return this.repo.find({ where: { sessionId }, order: { id: 'ASC' } });
  }

  findPendingBySession(sessionId: number): Promise<DrawItem[]> {
    return this.repo.find({ where: { sessionId, isDrawn: false } });
  }

  /** Only the pending (not yet drawn) rows among `ids` that actually belong to `sessionId` — used to validate a removal request in one query. */
  findPendingByIdsInSession(sessionId: number, ids: number[]): Promise<DrawItem[]> {
    if (ids.length === 0) return Promise.resolve([]);
    return this.repo.find({ where: { sessionId, id: In(ids), isDrawn: false } });
  }

  /** Hard-delete — these rows were never drawn, so there's no history to preserve. */
  async deleteMany(ids: number[]): Promise<void> {
    if (ids.length === 0) return;
    await this.repo.delete({ id: In(ids) });
  }

  async maxRoundNumber(sessionId: number): Promise<number> {
    const result = await this.repo
      .createQueryBuilder('item')
      .select('MAX(item.round_number)', 'max')
      .where('item.session_id = :sessionId', { sessionId })
      .getRawOne<{ max: string | null }>();
    return Number(result?.max ?? 0);
  }

  /** Grouped {total, drawn} counts for a batch of sessions — same shape as `TaskRepository.getSubtaskCounts`. */
  async countsForSessions(sessionIds: number[]): Promise<Map<number, { total: number; drawn: number }>> {
    const result = new Map<number, { total: number; drawn: number }>();
    if (sessionIds.length === 0) return result;

    const rows = await this.repo
      .createQueryBuilder('item')
      .select('item.session_id', 'sessionId')
      .addSelect('COUNT(*)', 'total')
      .addSelect('SUM(CASE WHEN item.is_drawn = 1 THEN 1 ELSE 0 END)', 'drawn')
      .where('item.session_id IN (:...sessionIds)', { sessionIds })
      .groupBy('item.session_id')
      .getRawMany<{ sessionId: string; total: string; drawn: string }>();

    for (const row of rows) {
      result.set(Number(row.sessionId), { total: Number(row.total), drawn: Number(row.drawn) });
    }
    return result;
  }
}
