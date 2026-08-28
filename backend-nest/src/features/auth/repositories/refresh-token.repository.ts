import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, MoreThan } from 'typeorm';
import { RefreshToken } from '../entities/refresh-token.entity.js';

@Injectable()
export class RefreshTokenRepository {
  constructor(
    @InjectRepository(RefreshToken)
    private readonly repo: Repository<RefreshToken>,
  ) {}

  findByTokenHash(tokenHash: string): Promise<RefreshToken | null> {
    return this.repo.findOne({ where: { tokenHash } });
  }

  findById(id: number): Promise<RefreshToken | null> {
    return this.repo.findOne({ where: { id } });
  }

  findActiveByUserId(userId: number): Promise<RefreshToken[]> {
    return this.repo.find({
      where: { userId, isRevoked: false, expiresAt: MoreThan(new Date()) },
      order: { createdAt: 'DESC' },
    });
  }

  create(data: Partial<RefreshToken>): RefreshToken {
    return this.repo.create(data);
  }

  save(token: RefreshToken): Promise<RefreshToken> {
    return this.repo.save(token);
  }

  async revokeById(id: number): Promise<void> {
    await this.repo.update({ id }, { isRevoked: true });
  }

  async revokeAllByUserId(userId: number): Promise<void> {
    await this.repo.update({ userId, isRevoked: false }, { isRevoked: true });
  }
}
