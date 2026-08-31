import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, Index, CreateDateColumn } from 'typeorm';
import type { Relation } from 'typeorm';
import { DrawSession } from './draw-session.entity.js';
import { Task } from '../../task/entities/task.entity.js';

@Index('idx_draw_items_session_id', ['sessionId'])
@Index('idx_draw_items_session_drawn', ['sessionId', 'isDrawn'])
@Entity('draw_items')
export class DrawItem {
  @PrimaryGeneratedColumn('increment', { type: 'bigint' })
  id: number;

  @Column({ name: 'session_id', type: 'bigint' })
  sessionId: number;

  @ManyToOne(() => DrawSession, { nullable: false, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'session_id' })
  session: Relation<DrawSession>;

  // Only set when the session's source is an existing task list — a
  // best-effort back-reference for the UI to link out to the real task.
  // Never mutated: drawing an item never touches the underlying Task row.
  @Column({ name: 'task_id', type: 'bigint', nullable: true })
  taskId: number | null;

  @ManyToOne(() => Task, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'task_id' })
  task: Relation<Task> | null;

  // Display text — snapshotted at session-creation time (the task's title,
  // or the raw manual entry), so a later rename/delete of the source task
  // never changes what a past draw showed.
  @Column({ type: 'varchar', length: 255 })
  label: string;

  @Column({ name: 'is_drawn', type: 'boolean', default: false })
  isDrawn: boolean;

  // 1-based; which draw() call pulled this item out of the pool. Doubles as
  // free round-history grouping for the UI — no separate history table.
  @Column({ name: 'round_number', type: 'int', nullable: true })
  roundNumber: number | null;

  @Column({ name: 'drawn_at', type: 'datetime', nullable: true })
  drawnAt: Date | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
