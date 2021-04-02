import { BaseEntity, BeforeInsert, BeforeUpdate, Column, CreateDateColumn, Entity, JoinColumn, JoinTable, ManyToMany, ManyToOne, PrimaryGeneratedColumn, UpdateDateColumn, VersionColumn } from 'typeorm';
import { User } from '../users/user.entity';
import { Trip } from '../trips/trip.entity';
import * as ETrip from './enums';

@Entity()
export class Post extends BaseEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  /**
   * @description Basic Area
   */
  @Column({ type: 'varchar', nullable: false })
  content: string;

  @Column({ type: 'simple-array', nullable: true })
  images?: string[];

  @Column({
    type: 'enum',
    enum: ETrip.ETripView,
    default: ETrip.ETripView.PUBLIC,
    nullable: false,
  })
  publicStatus: ETrip.ETripView;

  /**
   * @description Relation Area with user
   */
  @ManyToOne(
    () => User,
    (user) => user.posts,
  )
  @JoinColumn()
  publisher: User;

  /**
   * @description Relation Area with user like
   */
  @ManyToMany(
    () => User,
    (user) => user.likePosts,
  )
  @JoinTable()
  likeUsers?: User[];

  /**
   * @description Relation Area with trip
   */
  @ManyToOne(
    () => Trip,
    (trip) => trip.posts,
  )
  trip: Trip;

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
