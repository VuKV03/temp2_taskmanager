import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, Index, CreateDateColumn } from 'typeorm';
import type { Relation } from 'typeorm';
import { User } from '../../auth/entities/user.entity.js';

export type ActivityAction =
  | 'created'
  | 'updated'
  | 'status_changed'
  | 'assigned'
  | 'commented'
  | 'archived'
  | 'deleted';

@Index('idx_task_activities_user_created', ['userId', 'createdAt'])
@Entity('task_activities')
export class TaskActivity {
  @PrimaryGeneratedColumn('increment', { type: 'bigint' })
  id: number;

  // No relation to Task on purpose: `activity` must not depend on `task`
  // (task depends on activity, not the other way round). `taskTitle` below
  // is the snapshot that keeps history readable after the task is gone.
  @Index('idx_task_activities_task_id')
  @Column({ name: 'task_id', type: 'bigint', nullable: true })
  taskId: number | null;

  @Column({ name: 'user_id', type: 'bigint' })
  userId: number;

  @ManyToOne(() => User, { nullable: false })
  @JoinColumn({ name: 'user_id' })
  user: Relation<User>;

  @Column({ type: 'varchar', length: 30 })
  action: ActivityAction;

  @Column({ name: 'field_name', type: 'varchar', length: 50, nullable: true })
  fieldName: string | null;

  @Column({ name: 'old_value', type: 'varchar', length: 255, nullable: true })
  oldValue: string | null;

  @Column({ name: 'new_value', type: 'varchar', length: 255, nullable: true })
  newValue: string | null;

  @Column({ name: 'task_title', type: 'varchar', length: 255 })
  taskTitle: string;

  @Column({ type: 'json', nullable: true })
  metadata: Record<string, unknown> | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
