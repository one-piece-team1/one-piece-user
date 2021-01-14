import {
  Entity,
  BaseEntity,
  PrimaryGeneratedColumn,
  Column,
  Unique,
  Index,
  BeforeInsert,
  BeforeUpdate,
  CreateDateColumn,
  UpdateDateColumn,
  JoinColumn,
  OneToMany,
} from 'typeorm';
import * as bcrypt from 'bcrypt';
import * as EUser from './enums';
import { Trip } from '../trips/trip.entity';

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
   * @description Following Area
   */
  @Column({ type: 'int', nullable: false, default: 0 })
  followerCount: number;

  @Column({ type: 'int', nullable: false, default: 0 })
  followingCount: number;

  /**
   * @description User Info area
   */
  @Column({ type: 'enum', enum: EUser.EUserGender, nullable: true })
  gender?: EUser.EUserGender;

  @Column({ type: 'int', nullable: true })
  age?: number;

  @Column({ type: 'varchar', nullable: true })
  desc?: string;

  /**
   * @description Relation Area
   */
  @OneToMany(
    () => Trip,
    trip => trip.user,
  )
  @JoinColumn()
  trips: Trip[];

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
