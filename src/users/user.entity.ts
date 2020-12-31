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
} from 'typeorm';
import * as bcrypt from 'bcrypt';
import * as EUser from './enums';

@Entity()
@Unique(['username', 'email'])
export class User extends BaseEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  /**
   * @todo decide how to setup user role and which default yet
   */
  @Column({
    type: 'enum',
    enum: EUser.EUserRole,
    default: EUser.EUserRole.USER,
    nullable: false,
    insert: false,
  })
  role: EUser.EUserRole;

  @Column({ type: 'varchar', nullable: false })
  @Index({ unique: true })
  username: string;

  @Column({ type: 'varchar', nullable: false })
  @Index({ unique: true })
  email: string;

  @Column({ nullable: false })
  password: string;

  @Column({ nullable: false })
  salt: string;

  // represent if user is soft deleted or not, true means not deleted
  @Column({ type: 'boolean', default: true })
  status: boolean;

  @Column({ type: 'int', nullable: false, default: 0 })
  followerCount: number;

  @Column({ type: 'int', nullable: false, default: 0 })
  followingCount: number;

  @Column({ type: 'enum', enum: EUser.EUserGender, nullable: true })
  gender?: EUser.EUserGender;

  @Column({ type: 'int', nullable: true })
  age?: number;

  @Column({ type: 'varchar', nullable: true })
  desc?: string;

  @Column({ type: 'timestamp', nullable: false })
  expiredDate: number;

  @CreateDateColumn({ nullable: false })
  createdAt: Date;

  @UpdateDateColumn({ nullable: false })
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
