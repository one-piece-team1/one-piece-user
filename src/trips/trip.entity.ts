import { BaseEntity, BeforeInsert, BeforeUpdate, Column, CreateDateColumn, Entity, JoinColumn, ManyToMany, ManyToOne, OneToMany, PrimaryColumn, UpdateDateColumn } from 'typeorm';
import { User } from '../users/user.entity';
import { Post } from '../posts/post.entity';
import * as ETrip from './enums';

@Entity()
export class Trip extends BaseEntity {
  @PrimaryColumn('uuid')
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
  publisher: User;

  @ManyToMany(
    () => User,
    (user) => user.views,
  )
  @JoinColumn()
  viewers: User[];

  /**
   * @description Relation Area with post
   */
  @OneToMany(
    () => Post,
    (post) => post.trip,
  )
  posts: Post[];

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
