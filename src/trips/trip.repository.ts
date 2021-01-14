import { Logger } from '@nestjs/common';
import {
  EntityManager,
  EntityRepository,
  getManager,
  Repository,
} from 'typeorm';
import { Trip } from './trip.entity';

@EntityRepository(Trip)
export class TripRepository extends Repository<Trip> {
  private readonly repoManager: EntityManager = getManager();
  private readonly logger: Logger = new Logger('TripRepository');
}
