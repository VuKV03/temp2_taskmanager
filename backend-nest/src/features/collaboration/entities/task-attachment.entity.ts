import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, Index, CreateDateColumn } from 'typeorm';
import type { Relation } from 'typeorm';
import { Task } from '../../task/entities/task.entity.js';
import { User } from '../../auth/entities/user.entity.js';

@Entity('task_attachments')
export class TaskAttachment {
  @PrimaryGeneratedColumn('increment', { type: 'bigint' })
  id: number;

  @Index('idx_task_attachments_task_id')
  @Column({ name: 'task_id', type: 'bigint' })
  taskId: number;

  @ManyToOne(() => Task, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'task_id' })
  task: Relation<Task>;

  @Column({ name: 'uploaded_by', type: 'bigint' })
  uploadedBy: number;

  @ManyToOne(() => User, { nullable: false })
  @JoinColumn({ name: 'uploaded_by' })
  uploader: Relation<User>;

  @Column({ name: 'file_url', type: 'varchar', length: 500 })
  fileUrl: string;

  @Column({ name: 'file_name', type: 'varchar', length: 255 })
  fileName: string;

  @Column({ name: 'file_size', type: 'int' })
  fileSize: number;

  @Column({ name: 'mime_type', type: 'varchar', length: 100 })
  mimeType: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
