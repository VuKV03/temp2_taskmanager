import { Injectable } from '@nestjs/common';
import { AppException } from '../../shared/exceptions/app.exception.js';
import { ERROR_CODES } from '../../shared/constants/error-codes.constant.js';
import type { JwtPayload } from '../../shared/decorators/current-user.decorator.js';
import { TaskCardRepository } from './repositories/task-card.repository.js';
import { CreateTaskCardDto } from './dto/create-task-card.dto.js';
import { UpdateTaskCardDto } from './dto/update-task-card.dto.js';
import { toTaskCardResponse } from './types/task-card.types.js';
import type { TaskCardResponse } from './types/task-card.types.js';

@Injectable()
export class TaskCardService {
  constructor(private readonly taskCardRepository: TaskCardRepository) {}

  async findAll(user: JwtPayload): Promise<TaskCardResponse[]> {
    const cards = await this.taskCardRepository.findByOwner(user.id);
    const counts = await this.taskCardRepository.countsForCards(cards.map((c) => Number(c.id)));
    return cards.map((c) => toTaskCardResponse(c, counts.get(Number(c.id)) ?? 0));
  }

  async create(user: JwtPayload, dto: CreateTaskCardDto): Promise<TaskCardResponse> {
    const card = this.taskCardRepository.create({ ownerId: user.id, name: dto.name, sortOrder: 0 });
    const saved = await this.taskCardRepository.save(card);
    return toTaskCardResponse(saved, 0);
  }

  async update(user: JwtPayload, id: number, dto: UpdateTaskCardDto): Promise<TaskCardResponse> {
    const card = await this.getOwnedCard(user, id);
    if (dto.name !== undefined) card.name = dto.name;
    const saved = await this.taskCardRepository.save(card);
    const counts = await this.taskCardRepository.countsForCards([saved.id]);
    return toTaskCardResponse(saved, counts.get(Number(saved.id)) ?? 0);
  }

  async remove(user: JwtPayload, id: number): Promise<void> {
    await this.getOwnedCard(user, id);
    // `tasks.card_id` is `ON DELETE SET NULL` — removing a card only unlinks
    // its tasks, never deletes them (same spirit as "Bỏ khỏi Hôm nay").
    await this.taskCardRepository.delete(id);
  }

  private async getOwnedCard(user: JwtPayload, id: number) {
    const card = await this.taskCardRepository.findById(id);
    if (!card) {
      throw new AppException(ERROR_CODES.CARD_001);
    }
    if (card.ownerId !== user.id) {
      throw new AppException(ERROR_CODES.CARD_002);
    }
    return card;
  }
}
