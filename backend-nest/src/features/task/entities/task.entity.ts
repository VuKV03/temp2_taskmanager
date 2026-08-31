import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  OneToMany,
  ManyToMany,
  JoinColumn,
  JoinTable,
  Index,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import type { Relation } from 'typeorm';
import { TaskList } from '../../task-list/entities/task-list.entity.js';
import { TaskCard } from '../../task-card/entities/task-card.entity.js';
import { User } from '../../auth/entities/user.entity.js';
import { Tag } from './tag.entity.js';
import { TaskStatus, TaskPriority } from '../types/task.types.js';

@Index('idx_tasks_assignee_due', ['assigneeId', 'dueDate', 'status'])
@Index('idx_tasks_assignee_completed', ['assigneeId', 'completedAt'])
@Entity('tasks')
export class Task {
  @PrimaryGeneratedColumn('increment', { type: 'bigint' })
  id: number;

  @Index('idx_tasks_list_id')
  @Column({ name: 'list_id', type: 'bigint', nullable: true })
  listId: number | null;

  @ManyToOne(() => TaskList, { nullable: true })
  @JoinColumn({ name: 'list_id' })
  list: Relation<TaskList> | null;

  // Independent from `list` — a task can be in a list *and* a card at the
  // same time. See task-card/CONTEXT.md.
  @Index('idx_tasks_card_id')
  @Column({ name: 'card_id', type: 'bigint', nullable: true })
  cardId: number | null;

  @ManyToOne(() => TaskCard, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'card_id' })
  card: Relation<TaskCard> | null;

  @Index('idx_tasks_parent_task_id')
  @Column({ name: 'parent_task_id', type: 'bigint', nullable: true })
  parentTaskId: number | null;

  @ManyToOne(() => Task, (task) => task.subtasks, { nullable: true })
  @JoinColumn({ name: 'parent_task_id' })
  parent: Relation<Task> | null;

  @OneToMany(() => Task, (task) => task.parent)
  subtasks: Relation<Task>[];

  @Column({ name: 'creator_id', type: 'bigint' })
  creatorId: number;

  @ManyToOne(() => User, { nullable: false })
  @JoinColumn({ name: 'creator_id' })
  creator: Relation<User>;

  @Column({ name: 'assignee_id', type: 'bigint', nullable: true })
  assigneeId: number | null;

  @ManyToOne(() => User, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'assignee_id' })
  assignee: Relation<User> | null;

  @Column({ type: 'varchar', length: 255 })
  title: string;

  @Column({ type: 'text', nullable: true })
  description: string | null;

  @Index('idx_tasks_status')
  @Column({ type: 'varchar', length: 20, default: TaskStatus.TODO })
  status: TaskStatus;

  @Column({ type: 'varchar', length: 10, default: TaskPriority.MEDIUM })
  priority: TaskPriority;

  @Column({ name: 'start_date', type: 'datetime', nullable: true })
  startDate: Date | null;

  @Index('idx_tasks_due_date')
  @Column({ name: 'due_date', type: 'datetime', nullable: true })
  dueDate: Date | null;

  @Index('idx_tasks_completed_at')
  @Column({ name: 'completed_at', type: 'datetime', nullable: true })
  completedAt: Date | null;

  @Column({ name: 'estimate_minutes', type: 'int', nullable: true })
  estimateMinutes: number | null;

  // Workload in "points" — 1 point = 1 day, per user's own convention (no
  // fixed real-world meaning enforced server-side). Decimal so half-days
  // etc. work. mysql2 returns DECIMAL columns as strings by default; the
  // transformer keeps `Task.points` a real JS number everywhere, instead of
  // relying on every call site to remember to coerce it (see the bigint-id
  // gotcha this same repo already hit more than once).
  @Column({
    type: 'decimal',
    precision: 5,
    scale: 2,
    nullable: true,
    transformer: {
      to: (value: number | null) => value,
      from: (value: string | null) => (value === null ? null : parseFloat(value)),
    },
  })
  points: number | null;

  @Column({ name: 'recurrence_rule', type: 'varchar', length: 100, nullable: true })
  recurrenceRule: string | null;

  @Column({ name: 'sort_order', type: 'int', default: 0 })
  sortOrder: number;

  @Column({ name: 'is_archived', type: 'boolean', default: false })
  isArchived: boolean;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @ManyToMany(() => Tag, (tag) => tag.tasks)
  @JoinTable({
    name: 'task_tags',
    joinColumn: { name: 'task_id' },
    inverseJoinColumn: { name: 'tag_id' },
  })
  tags: Relation<Tag>[];
}
