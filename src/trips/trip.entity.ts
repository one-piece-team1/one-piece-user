import { BaseEntity, BeforeInsert, BeforeUpdate, Column, CreateDateColumn, Entity, JoinColumn, ManyToMany, ManyToOne, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';
import { User } from '../users/user.entity';
import * as ETrip from './enums';

@Entity()
export class Trip extends BaseEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'timestamp', nullable: false })
  startDate: Date;

  @Column({ type: 'timestamp', nullable: false })
  endDate: Date;

  @Column({
    type: 'enum',
    enum: ETrip.ETripView,
    default: ETrip.ETripView.PUBLIC,
    nullable: false,
  })
  publicStatus: string;

  @Column({ type: 'varchar', nullable: true })
  companyName?: string;

  @Column({ type: 'varchar', nullable: true })
  shipNumber?: string;

  /**
   * @description Relation Area with User
   */
  @ManyToOne(
    () => User,
    (user) => user.trips,
  )
  @JoinColumn()
  user: User;

  @ManyToMany(
    (type) => User,
    (user) => user.views,
  )
  @JoinColumn()
  viewers: User[];

  /**
   * @description Time area
   */
  @CreateDateColumn({ type: 'timestamp', nullable: false })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamp', nullable: false })
  updatedAt: Date;

  @BeforeInsert()
  updateWhenInsert() {
    this.createdAt = new Date();
    this.updatedAt = new Date();
  }

  @BeforeUpdate()
  updateDateWhenUpdate() {
    this.updatedAt = new Date();
  }
}
