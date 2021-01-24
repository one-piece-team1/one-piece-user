import { Entity, BaseEntity, PrimaryGeneratedColumn, Column, Unique, Index, BeforeInsert, BeforeUpdate, CreateDateColumn, UpdateDateColumn, JoinColumn, OneToMany, ManyToMany, AfterLoad } from 'typeorm';
import * as bcrypt from 'bcrypt';
import * as EUser from './enums';
import { Trip } from '../trips/trip.entity';
import { Post } from '../posts/post.entity';

@Entity()
@Unique(['username', 'email'])
export class User extends BaseEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  /**
   * @description User Role is default to 'user' and the others just for backup for future
   */
  @Column({
    type: 'enum',
    enum: EUser.EUserRole,
    default: EUser.EUserRole.USER,
    nullable: false,
    insert: false,
  })
  role: EUser.EUserRole;

  /**
   * @description Currently no use
   */
  @Column({ type: 'timestamp', nullable: false })
  expiredDate: Date;

  /**
   * @description User Credits area includes diamondCoin & goldCoin
   * @detail diamondCoin is used for deposit
   * @detail goldCoin is used for daily reward or other event reward
   */
  @Column({ type: 'int', nullable: false, default: 0, insert: false })
  diamondCoin: number;

  @Column({ type: 'int', nullable: false, default: 10, insert: false })
  goldCoin: number;

  /**
   * @description Basic Info area
   */
  @Column({ type: 'varchar', nullable: false })
  @Index({ unique: true })
  username: string;

  @Column({ type: 'varchar', nullable: false })
  @Index({ unique: true })
  email: string;

  @Column({ type: 'varchar', nullable: false })
  password: string;

  @Column({ type: 'varchar', nullable: false })
  salt: string;

  /**
   * @description Represent if user is soft deleted or not, true means not deleted
   */
  @Column({ type: 'boolean', default: true })
  status: boolean;

  /**
   * @description User Info area
   */
  @Column({ type: 'enum', enum: EUser.EUserGender, nullable: true })
  gender?: EUser.EUserGender;

  @Column({ type: 'int', nullable: true })
  age?: number;

  @Column({ type: 'varchar', nullable: true })
  desc?: string;

  @Column({ type: 'varchar', nullable: true })
  profileImage?: string;

  /**
   * @description Relation Area with trip
   */
  @OneToMany(
    () => Trip,
    (trip) => trip.publisher,
  )
  @JoinColumn()
  trips: Trip[];

  @ManyToMany(
    () => Trip,
    (trip) => trip.viewers,
  )
  @JoinColumn()
  views: Trip[];

  /**
   * @description Relation Area with post
   */
  @OneToMany(
    () => Post,
    (post) => post.publisher,
  )
  posts: Post[];

  /**
   * @description Relation Area with post like
   */
  @ManyToMany(
    () => Post,
    (post) => post.likeUsers,
  )
  @JoinColumn()
  likePosts: Post[];

  /**
   * @description Following Area
   */
  @ManyToMany(
    () => User,
    (user) => user.following,
  )
  @JoinColumn()
  followers: User[];

  @ManyToMany(
    () => User,
    (user) => user.followers,
  )
  @JoinColumn()
  following: User[];

  @OneToMany(
    () => User,
    (user) => user.blockLists,
  )
  @JoinColumn()
  blockLists: User[];

  @Column({ type: 'int', nullable: false, default: 0 })
  followerCount: number;

  @Column({ type: 'int', nullable: false, default: 0 })
  followingCount: number;

  @AfterLoad()
  async countFollowers() {
    this.followerCount = this.followers ? this.followers.length : 0;
  }

  @AfterLoad()
  async countFollowings() {
    this.followingCount = this.following ? this.following.length : 0;
  }

  /**
   * @description Time area
   */
  @CreateDateColumn({ type: 'timestamp', nullable: false })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamp', nullable: false })
  updatedAt: Date;

  async validatePassword(password: string): Promise<boolean> {
    const hash = await bcrypt.hash(password, this.salt);
    return hash === this.password;
  }

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
