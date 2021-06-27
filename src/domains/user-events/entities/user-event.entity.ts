import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity()
export class UserEvent {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'boolean', nullable: false, default: false })
  status: boolean;

  @Column({ type: 'varchar', nullable: false })
  type: string;

  @Column({ type: 'jsonb', nullable: false })
  data: unknown;

  @Column({ type: 'simple-array', nullable: true })
  targets?: string[];

  @Column({ type: 'varchar', array: true, nullable: false, default: () => 'Array[]::varchar[]' })
  topics: string[];
}
