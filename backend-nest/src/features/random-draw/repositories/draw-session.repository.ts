import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { DrawSession } from '../entities/draw-session.entity.js';

@Injectable()
export class DrawSessionRepository {
  constructor(
    @InjectRepository(DrawSession)
    private readonly repo: Repository<DrawSession>,
  ) {}

  findByOwner(ownerId: number): Promise<DrawSession[]> {
    return this.repo.find({ where: { ownerId }, order: { createdAt: 'DESC' } });
  }

  findById(id: number): Promise<DrawSession | null> {
    return this.repo.findOne({ where: { id } });
  }

  create(data: Partial<DrawSession>): DrawSession {
    return this.repo.create(data);
  }

  save(session: DrawSession): Promise<DrawSession> {
    return this.repo.save(session);
  }

  async delete(id: number): Promise<void> {
    await this.repo.delete({ id });
  }
}
