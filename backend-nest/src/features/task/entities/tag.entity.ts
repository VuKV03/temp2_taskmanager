import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, Index, ManyToMany } from 'typeorm';
import type { Relation } from 'typeorm';
import { User } from '../../auth/entities/user.entity.js';
import { Task } from './task.entity.js';

@Index('UQ_tags_user_name', ['userId', 'name'], { unique: true })
@Entity('tags')
export class Tag {
  @PrimaryGeneratedColumn('increment', { type: 'bigint' })
  id: number;

  // NULL = system tag (created by an admin, visible to everyone)
  @Column({ name: 'user_id', type: 'bigint', nullable: true })
  userId: number | null;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'user_id' })
  user: Relation<User> | null;

  @Column({ type: 'varchar', length: 50 })
  name: string;

  @Column({ type: 'varchar', length: 7, nullable: true })
  color: string | null;

  @ManyToMany(() => Task, (task) => task.tags)
  tasks: Relation<Task>[];
}
