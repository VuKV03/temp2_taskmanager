import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, IsNull, Repository } from 'typeorm';
import { Tag } from '../entities/tag.entity.js';

@Injectable()
export class TagRepository {
  constructor(
    @InjectRepository(Tag)
    private readonly repo: Repository<Tag>,
  ) {}

  /** User's own tags + system tags (user_id IS NULL). */
  findForUser(userId: number): Promise<Tag[]> {
    return this.repo
      .createQueryBuilder('tag')
      .where('tag.userId = :userId OR tag.userId IS NULL', { userId })
      .orderBy('tag.name', 'ASC')
      .getMany();
  }

  findById(id: number): Promise<Tag | null> {
    return this.repo.findOne({ where: { id } });
  }

  findByIds(ids: number[]): Promise<Tag[]> {
    return this.repo.find({ where: { id: In(ids) } });
  }

  /** Tags in `ids` that `userId` may use: their own tags + system tags. */
  async findAccessibleByIds(userId: number, ids: number[]): Promise<Tag[]> {
    if (ids.length === 0) return [];
    return this.repo
      .createQueryBuilder('tag')
      .where('tag.id IN (:...ids)', { ids })
      .andWhere('(tag.userId = :userId OR tag.userId IS NULL)', { userId })
      .getMany();
  }

  findByOwnerAndName(userId: number | null, name: string): Promise<Tag | null> {
    return this.repo.findOne({ where: { userId: userId ?? IsNull(), name } });
  }

  create(data: Partial<Tag>): Tag {
    return this.repo.create(data);
  }

  save(tag: Tag): Promise<Tag> {
    return this.repo.save(tag);
  }

  async remove(tag: Tag): Promise<void> {
    await this.repo.remove(tag);
  }
}
