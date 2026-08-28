import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, Index, CreateDateColumn } from 'typeorm';
import type { Relation } from 'typeorm';
import { User } from '../../auth/entities/user.entity.js';

export type NotificationType = 'due_soon' | 'overdue' | 'assigned' | 'commented';

@Index('idx_notifications_user_read_created', ['userId', 'isRead', 'createdAt'])
@Entity('notifications')
export class Notification {
  @PrimaryGeneratedColumn('increment', { type: 'bigint' })
  id: number;

  @Column({ name: 'user_id', type: 'bigint' })
  userId: number;

  @ManyToOne(() => User, { nullable: false })
  @JoinColumn({ name: 'user_id' })
  user: Relation<User>;

  // No relation to Task on purpose, same reasoning as `task_activities` —
  // a notification about a task must survive that task being hard-deleted.
  @Column({ name: 'task_id', type: 'bigint', nullable: true })
  taskId: number | null;

  @Column({ type: 'varchar', length: 30 })
  type: NotificationType;

  @Column({ type: 'varchar', length: 255 })
  message: string;

  @Column({ name: 'is_read', type: 'boolean', default: false })
  isRead: boolean;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
