import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, Index, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import type { Relation } from 'typeorm';
import { User } from '../../auth/entities/user.entity.js';
import { TaskList } from '../../task-list/entities/task-list.entity.js';
import { DrawSourceType, DrawSessionStatus } from '../types/random-draw.types.js';

@Index('idx_draw_sessions_owner_id', ['ownerId'])
@Entity('draw_sessions')
export class DrawSession {
  @PrimaryGeneratedColumn('increment', { type: 'bigint' })
  id: number;

  @Column({ name: 'owner_id', type: 'bigint' })
  ownerId: number;

  @ManyToOne(() => User, { nullable: false })
  @JoinColumn({ name: 'owner_id' })
  owner: Relation<User>;

  @Column({ type: 'varchar', length: 100 })
  name: string;

  @Column({ name: 'source_type', type: 'varchar', length: 20 })
  sourceType: DrawSourceType;

  // Only set when sourceType = 'task_list' — a snapshot pointer back to
  // where the pool came from, never used to re-read task data (items are
  // snapshotted into draw_items at creation time, see CONTEXT.md).
  @Column({ name: 'source_list_id', type: 'bigint', nullable: true })
  sourceListId: number | null;

  @ManyToOne(() => TaskList, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'source_list_id' })
  sourceList: Relation<TaskList> | null;

  @Column({ type: 'varchar', length: 20, default: DrawSessionStatus.ACTIVE })
  status: DrawSessionStatus;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
