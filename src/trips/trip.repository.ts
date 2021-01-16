import { Logger } from '@nestjs/common';
import { EntityManager, EntityRepository, getManager, Repository } from 'typeorm';
import { Trip } from './trip.entity';

@EntityRepository(Trip)
export class TripRepository extends Repository<Trip> {
  private readonly repoManager: EntityManager = getManager();
  private readonly logger: Logger = new Logger('TripRepository');

  public createTrip(tripReq: Trip): void {
    this.repoManager.save(Trip, tripReq).catch((err) => this.logger.log(err.message, 'CreateTrip'));
  }
}
