import { BaseEntity, BeforeInsert, Column, CreateDateColumn, Entity, PrimaryGeneratedColumn } from 'typeorm';
import * as EAudit from '../enums';

@Entity()
export class PostAuditLog extends BaseEntity {
  @PrimaryGeneratedColumn('increment')
  id: number;

  @Column({
    type: 'enum',
    enum: EAudit.EAduitType,
    default: EAudit.EAduitType.CREATE,
    nullable: false,
  })
  type: EAudit.EAduitType;

  @Column({ type: 'int', nullable: false })
  version: number;

  @Column({ type: 'varchar', nullable: false })
  postId: string;

  @Column({ type: 'varchar', nullable: true })
  updateAlias?: string;

  /**
   * @description Time area
   */
  @CreateDateColumn({ type: 'timestamp', nullable: false })
  createdAt: Date;

  @BeforeInsert()
  updateWhenInsert() {
    this.createdAt = new Date();
  }
}
