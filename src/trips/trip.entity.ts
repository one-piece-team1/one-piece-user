import { BaseEntity, BeforeInsert, BeforeUpdate, Column, CreateDateColumn, Entity, JoinColumn, JoinTable, ManyToMany, ManyToOne, OneToMany, PrimaryColumn, UpdateDateColumn, VersionColumn } from 'typeorm';
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
  publicStatus: ETrip.ETripView;

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
  @JoinTable()
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
   * @description version control
   */
  @VersionColumn({ nullable: true })
  version: number;

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
