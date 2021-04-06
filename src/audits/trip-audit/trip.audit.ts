import { InternalServerErrorException } from '@nestjs/common';
import { EntitySubscriberInterface, EventSubscriber, InsertEvent, RemoveEvent, UpdateEvent } from 'typeorm';
import { Trip } from '../../trips/trip.entity';
import { TripAuditLog } from './trip-audit.entity';
import * as EAudit from '../enums';

@EventSubscriber()
export class TripAuditSubscriber implements EntitySubscriberInterface<Trip> {
  /**
   * @description Listen to trip entity changing
   * @public
   * @returns {Trip}
   */
  public listenTo() {
    return Trip;
  }

  /**
   * @description Called after entity insertion
   * @event
   * @create
   * @public
   * @param {InsertEvent<Trip>} event
   */
  public afterInsert(event: InsertEvent<Trip>) {
    this.insertCreateEvent(event.entity);
  }

  /**
   * @description Called after entity update
   * @event
   * @update
   * @public
   * @param {UpdateEvent<Trip>} event
   */
  public afterUpdate(event: UpdateEvent<Trip>) {
    this.insertUpdateEvent(event);
  }

  /**
   * @description Called after entity delete
   * @event
   * @remove
   * @public
   * @param {RemoveEvent<Trip>} event
   */
  public afterRemove(event: RemoveEvent<Trip>) {
    this.insertDeleteEvent(event.entity);
  }

  /**
   * @description Insert create trip log
   * @private
   * @param {Trip} event
   */
  private async insertCreateEvent(event: Trip) {
    const auditLog = new TripAuditLog();
    auditLog.version = event.version;
    auditLog.tripId = event.id;
    auditLog.type = EAudit.EAduitType.CREATE;
    try {
      await auditLog.save();
    } catch (error) {
      throw new InternalServerErrorException(error.message);
    }
  }

  /**
   * @description Insert update trip log
   * @private
   * @param {UpdateEvent<Trip>} event
   */
  private async insertUpdateEvent(event: UpdateEvent<Trip>) {
    const auditLog = new TripAuditLog();
    auditLog.version = event.entity.version;
    auditLog.tripId = event.entity.id;
    auditLog.type = EAudit.EAduitType.UPDATE;
    auditLog.updateAlias = event.updatedColumns.map((col) => col.databaseName).join(',');
    try {
      await auditLog.save();
    } catch (error) {
      throw new InternalServerErrorException(error.message);
    }
  }

  /**
   * @description Insert delete trip log
   * @public
   * @param {Trip} event
   */
  private async insertDeleteEvent(event: Trip) {
    const auditLog = new TripAuditLog();
    auditLog.version = event.version;
    auditLog.tripId = event.id;
    auditLog.type = EAudit.EAduitType.DELETE;
    try {
      await auditLog.save();
    } catch (error) {
      throw new InternalServerErrorException(error.message);
    }
  }
}
