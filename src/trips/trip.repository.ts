import { Logger } from '@nestjs/common';
import { EntityRepository, getRepository, Repository } from 'typeorm';
import { Trip } from './trip.entity';
import { config } from '../../config';

@EntityRepository(Trip)
export class TripRepository extends Repository<Trip> {
  private readonly connectionName: string = config.ENV === 'test' ? 'testConnection' : 'default';
  private readonly logger: Logger = new Logger('TripRepository');

  public createTrip(tripReq: Trip): void {
    getRepository(Trip, this.connectionName)
      .save(tripReq)
      .catch((err) => this.logger.log(err.message, 'CreateTrip'));
  }
}
