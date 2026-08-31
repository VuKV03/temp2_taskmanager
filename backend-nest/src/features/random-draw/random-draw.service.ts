import { Injectable } from '@nestjs/common';
import { AppException } from '../../shared/exceptions/app.exception.js';
import { ERROR_CODES } from '../../shared/constants/error-codes.constant.js';
import { shuffle } from '../../shared/utils/shuffle.util.js';
import type { JwtPayload } from '../../shared/decorators/current-user.decorator.js';
import { TaskListRepository } from '../task-list/repositories/task-list.repository.js';
import { TaskRepository } from '../task/repositories/task.repository.js';
import { DrawSessionRepository } from './repositories/draw-session.repository.js';
import { DrawItemRepository } from './repositories/draw-item.repository.js';
import { DrawSession } from './entities/draw-session.entity.js';
import { DrawItem } from './entities/draw-item.entity.js';
import { CreateDrawSessionDto } from './dto/create-draw-session.dto.js';
import { DrawDto } from './dto/draw.dto.js';
import { UpdateDrawSessionDto } from './dto/update-draw-session.dto.js';
import { DrawSourceType, DrawSessionStatus, toDrawItemResponse, toDrawSessionResponse } from './types/random-draw.types.js';
import type { DrawSessionResponse, DrawSessionDetailResponse, DrawResultResponse } from './types/random-draw.types.js';

@Injectable()
export class RandomDrawService {
  constructor(
    private readonly sessionRepository: DrawSessionRepository,
    private readonly itemRepository: DrawItemRepository,
    private readonly taskListRepository: TaskListRepository,
    private readonly taskRepository: TaskRepository,
  ) {}

  async findAll(user: JwtPayload): Promise<DrawSessionResponse[]> {
    const sessions = await this.sessionRepository.findByOwner(user.id);
    const counts = await this.itemRepository.countsForSessions(sessions.map((s) => Number(s.id)));
    return sessions.map((s) => toDrawSessionResponse(s, counts.get(Number(s.id)) ?? { total: 0, drawn: 0 }));
  }

  async findOne(user: JwtPayload, id: number): Promise<DrawSessionDetailResponse> {
    const session = await this.getOwnedSession(user, id);
    const items = await this.itemRepository.findBySession(session.id);
    const counts = { total: items.length, drawn: items.filter((i) => i.isDrawn).length };
    return { ...toDrawSessionResponse(session, counts), items: items.map(toDrawItemResponse) };
  }

  async create(user: JwtPayload, dto: CreateDrawSessionDto): Promise<DrawSessionDetailResponse> {
    const pool = await this.resolvePool(user, dto);
    if (pool.length === 0) {
      throw new AppException(ERROR_CODES.DRAW_004);
    }

    const session = this.sessionRepository.create({
      ownerId: user.id,
      name: dto.name,
      sourceType: dto.sourceType,
      sourceListId: dto.sourceType === DrawSourceType.TASK_LIST ? (dto.sourceListId ?? null) : null,
      status: DrawSessionStatus.ACTIVE,
    });
    const savedSession = await this.sessionRepository.save(session);

    const items = this.itemRepository.createMany(
      pool.map((entry) => ({ sessionId: savedSession.id, taskId: entry.taskId, label: entry.label, isDrawn: false })),
    );
    const savedItems = await this.itemRepository.saveMany(items);

    return {
      ...toDrawSessionResponse(savedSession, { total: savedItems.length, drawn: 0 }),
      items: savedItems.map(toDrawItemResponse),
    };
  }

  async draw(user: JwtPayload, id: number, dto: DrawDto): Promise<DrawResultResponse> {
    const session = await this.getOwnedSession(user, id);
    const pending = await this.itemRepository.findPendingBySession(session.id);

    if (session.status === DrawSessionStatus.COMPLETED || pending.length === 0) {
      throw new AppException(ERROR_CODES.DRAW_003);
    }

    // Clamp instead of rejecting an over-large request — the whole point is
    // to always be able to "vét cạn" (exhaust) the pool, including a final
    // round smaller than what was asked for.
    const actualCount = Math.min(dto.count, pending.length);
    const picked = shuffle(pending).slice(0, actualCount);

    const nextRound = (await this.itemRepository.maxRoundNumber(session.id)) + 1;
    const now = new Date();
    for (const item of picked) {
      item.isDrawn = true;
      item.drawnAt = now;
      item.roundNumber = nextRound;
    }
    const drawnItems = await this.itemRepository.saveMany(picked);

    const remainingAfter = pending.length - actualCount;
    if (remainingAfter === 0) {
      session.status = DrawSessionStatus.COMPLETED;
      await this.sessionRepository.save(session);
    }

    const allItems = await this.itemRepository.findBySession(session.id);
    const counts = { total: allItems.length, drawn: allItems.filter((i) => i.isDrawn).length };

    return {
      session: toDrawSessionResponse(session, counts),
      drawnItems: drawnItems.map(toDrawItemResponse),
      requestedCount: dto.count,
      actualCount,
    };
  }

  async remove(user: JwtPayload, id: number): Promise<void> {
    await this.getOwnedSession(user, id);
    await this.sessionRepository.delete(id);
  }

  async update(user: JwtPayload, id: number, dto: UpdateDrawSessionDto): Promise<DrawSessionDetailResponse> {
    const session = await this.getOwnedSession(user, id);

    if (dto.removeItemIds?.length) {
      const removable = await this.itemRepository.findPendingByIdsInSession(session.id, dto.removeItemIds);
      if (removable.length !== new Set(dto.removeItemIds).size) {
        // Caller asked to remove something that's already drawn, doesn't
        // exist, or belongs to another session — reject the whole request
        // rather than silently dropping only some of it.
        throw new AppException(ERROR_CODES.DRAW_005);
      }
      await this.itemRepository.deleteMany(dto.removeItemIds);
    }

    if (dto.addItems?.length) {
      const current = await this.itemRepository.findBySession(session.id);
      const existingLabels = new Set(current.map((i) => i.label));
      const newLabels = this.normalizeLabels(dto.addItems, existingLabels);
      if (newLabels.length > 0) {
        const newItems = this.itemRepository.createMany(
          newLabels.map((label) => ({ sessionId: session.id, taskId: null, label, isDrawn: false })),
        );
        await this.itemRepository.saveMany(newItems);
      }
    }

    if (dto.name !== undefined) {
      session.name = dto.name;
    }

    // Adding items can reopen a 'completed' session; removing the last
    // pending items can complete an 'active' one — always recompute from
    // the actual remaining count rather than trying to track it through
    // the two branches above.
    const remaining = await this.itemRepository.findPendingBySession(session.id);
    session.status = remaining.length > 0 ? DrawSessionStatus.ACTIVE : DrawSessionStatus.COMPLETED;
    await this.sessionRepository.save(session);

    return this.findOne(user, id);
  }

  private async getOwnedSession(user: JwtPayload, id: number): Promise<DrawSession> {
    const session = await this.sessionRepository.findById(id);
    if (!session) {
      throw new AppException(ERROR_CODES.DRAW_001);
    }
    if (session.ownerId !== user.id) {
      throw new AppException(ERROR_CODES.DRAW_002);
    }
    return session;
  }

  /** Snapshots the pool at creation time — later edits/deletes on the source list never change a session already in progress. */
  private async resolvePool(
    user: JwtPayload,
    dto: CreateDrawSessionDto,
  ): Promise<Pick<DrawItem, 'taskId' | 'label'>[]> {
    if (dto.sourceType === DrawSourceType.TASK_LIST) {
      const list = await this.taskListRepository.findById(dto.sourceListId as number);
      if (!list) {
        throw new AppException(ERROR_CODES.LIST_001);
      }
      if (list.ownerId !== user.id) {
        throw new AppException(ERROR_CODES.LIST_002);
      }
      const tasks = await this.taskRepository.findLeanByListId(list.id);
      return tasks.map((task) => ({ taskId: Number(task.id), label: task.title }));
    }

    const labels = this.normalizeLabels(dto.items ?? [], new Set());
    return labels.map((label) => ({ taskId: null, label }));
  }

  /** Trims, drops blanks, and dedupes — both against each other and against `existingLabels` (e.g. a session's current pool when appending via `update()`). */
  private normalizeLabels(raw: string[], existingLabels: Set<string>): string[] {
    const seen = new Set(existingLabels);
    const labels: string[] = [];
    for (const entry of raw) {
      const label = entry.trim();
      if (!label || seen.has(label)) continue;
      seen.add(label);
      labels.push(label);
    }
    return labels;
  }
}
