import { InternalServerErrorException } from '@nestjs/common';
import { EntitySubscriberInterface, EventSubscriber, InsertEvent, RemoveEvent, UpdateEvent } from 'typeorm';
import { User } from '../../users/user.entity';
import { UserAuditLog } from './user-audit.entity';
import * as EAudit from '../enums';

@EventSubscriber()
export class UserAuditSubscriber implements EntitySubscriberInterface<User> {
  /**
   * @description Listen to user entity changing
   * @public
   * @returns {User}
   */
  public listenTo() {
    return User;
  }

  /**
   * @description Called after entity insertion
   * @event
   * @create
   * @public
   * @param {InsertEvent<User>} event
   */
  public afterInsert(event: InsertEvent<User>) {
    this.insertCreateEvent(event.entity);
  }

  /**
   * @description Called after entity update
   * @event
   * @update
   * @public
   * @param {UpdateEvent<User>} event
   */
  public afterUpdate(event: UpdateEvent<User>) {
    this.insertUpdateEvent(event);
  }

  /**
   * @description Called after entity delete
   * @event
   * @remove
   * @public
   * @param {RemoveEvent<User>} event
   */
  public afterRemove(event: RemoveEvent<User>) {
    this.insertDeleteEvent(event.entity);
  }

  /**
   * @description Insert create user log
   * @private
   * @param {User} event
   */
  private async insertCreateEvent(event: User) {
    const auditLog = new UserAuditLog();
    auditLog.version = event.version;
    auditLog.userId = event.id;
    auditLog.type = EAudit.EAduitType.CREATE;
    try {
      await auditLog.save();
    } catch (error) {
      throw new InternalServerErrorException(error.message);
    }
  }

  /**
   * @description Insert update user log
   * @private
   * @param {UpdateEvent<User>} event
   */
  private async insertUpdateEvent(event: UpdateEvent<User>) {
    const auditLog = new UserAuditLog();
    auditLog.version = event.entity.version;
    auditLog.userId = event.entity.id;
    auditLog.type = EAudit.EAduitType.UPDATE;
    auditLog.updateAlias = event.updatedColumns.map((col) => col.databaseName).join(',');
    try {
      await auditLog.save();
    } catch (error) {
      throw new InternalServerErrorException(error.message);
    }
  }

  /**
   * @description Insert delete user log
   * @public
   * @param {User} event
   */
  private async insertDeleteEvent(event: User) {
    const auditLog = new UserAuditLog();
    auditLog.version = event.version;
    auditLog.userId = event.id;
    auditLog.type = EAudit.EAduitType.DELETE;
    try {
      await auditLog.save();
    } catch (error) {
      throw new InternalServerErrorException(error.message);
    }
  }
}
