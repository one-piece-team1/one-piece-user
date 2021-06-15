import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity()
export class UserEvent {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'boolean', nullable: false, default: false })
  status: boolean;

  @Column({ type: 'varchar', nullable: false })
  requestId: string;

  @Column({ type: 'varchar', nullable: false })
  type: string;

  @Column({ type: 'jsonb', nullable: false })
  data: Array<any>;

  @Column({ type: 'jsonb', nullable: true })
  response?: Array<any>;
}
