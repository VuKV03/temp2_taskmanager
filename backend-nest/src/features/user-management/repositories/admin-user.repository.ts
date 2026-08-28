import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../../auth/entities/user.entity.js';
import { Role } from '../../auth/entities/role.entity.js';
import type { QueryUserDto } from '../dto/query-user.dto.js';

@Injectable()
export class AdminUserRepository {
  constructor(
    @InjectRepository(User)
    private readonly repo: Repository<User>,
    @InjectRepository(Role)
    private readonly roleRepo: Repository<Role>,
  ) {}

  async findMany(query: QueryUserDto): Promise<{ items: User[]; total: number }> {
    const qb = this.repo.createQueryBuilder('user').leftJoinAndSelect('user.role', 'role');

    if (query.role) qb.andWhere('role.name = :role', { role: query.role });
    if (query.isActive !== undefined) qb.andWhere('user.isActive = :isActive', { isActive: query.isActive });
    if (query.q) qb.andWhere('(user.email LIKE :q OR user.fullName LIKE :q)', { q: `%${query.q}%` });

    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    qb.orderBy('user.createdAt', 'DESC')
      .skip((page - 1) * limit)
      .take(limit);

    const [items, total] = await qb.getManyAndCount();
    return { items, total };
  }

  findById(id: number): Promise<User | null> {
    return this.repo.findOne({ where: { id }, relations: { role: true } });
  }

  findByEmail(email: string): Promise<User | null> {
    return this.repo.findOne({ where: { email } });
  }

  findRoleByName(name: 'admin' | 'member'): Promise<Role | null> {
    return this.roleRepo.findOne({ where: { name } });
  }

  /** Count of users currently holding the `admin` role — active or not (see CONTEXT.md rule #2). */
  countAdmins(): Promise<number> {
    return this.repo.createQueryBuilder('user').innerJoin('user.role', 'role').where('role.name = :role', { role: 'admin' }).getCount();
  }

  create(data: Partial<User>): User {
    return this.repo.create(data);
  }

  save(user: User): Promise<User> {
    return this.repo.save(user);
  }
}
