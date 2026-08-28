import { Injectable } from '@nestjs/common';
import { InjectRepository, InjectDataSource } from '@nestjs/typeorm';
import { DataSource, In, Repository } from 'typeorm';
import { TaskList } from '../entities/task-list.entity.js';

@Injectable()
export class TaskListRepository {
  constructor(
    @InjectRepository(TaskList)
    private readonly repo: Repository<TaskList>,
    // Only used for the raw task-count query below — see comment there.
    @InjectDataSource()
    private readonly dataSource: DataSource,
  ) {}

  findByOwner(ownerId: number, includeArchived: boolean): Promise<TaskList[]> {
    return this.repo.find({
      where: includeArchived ? { ownerId } : { ownerId, isArchived: false },
      order: { sortOrder: 'ASC', createdAt: 'ASC' },
    });
  }

  findById(id: number): Promise<TaskList | null> {
    return this.repo.findOne({ where: { id } });
  }

  findByOwnerAndName(ownerId: number, name: string): Promise<TaskList | null> {
    return this.repo.findOne({ where: { ownerId, name } });
  }

  findByIds(ids: number[]): Promise<TaskList[]> {
    return this.repo.find({ where: { id: In(ids) } });
  }

  create(data: Partial<TaskList>): TaskList {
    return this.repo.create(data);
  }

  save(list: TaskList): Promise<TaskList> {
    return this.repo.save(list);
  }

  async saveMany(lists: TaskList[]): Promise<TaskList[]> {
    return this.repo.save(lists);
  }

  /**
   * `task` depends on `task-list` (not the other way round — see
   * BE-ARCHITECTURE.md), so this queries the `tasks` table directly by
   * name instead of importing the Task entity/repository, to avoid a
   * circular module dependency. Read-only, single COUNT — acceptable
   * escape hatch; anything more should go through an event or a shared
   * read model instead.
   */
  async countActiveTasks(listId: number): Promise<number> {
    const rows = await this.dataSource.query(
      'SELECT COUNT(*) as count FROM tasks WHERE list_id = ? AND is_archived = 0',
      [listId],
    );
    return Number(rows[0]?.count ?? 0);
  }
}
