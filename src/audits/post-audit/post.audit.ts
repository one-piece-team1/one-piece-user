import { InternalServerErrorException } from '@nestjs/common';
import { EntitySubscriberInterface, EventSubscriber, InsertEvent, RemoveEvent, UpdateEvent } from 'typeorm';
import { Post } from '../../posts/post.entity';
import { PostAuditLog } from './post-audit.entity';
import * as EAudit from '../enums';

@EventSubscriber()
export class PostAuditSubscriber implements EntitySubscriberInterface<Post> {
  /**
   * @description Listen to post entity changing
   * @public
   * @returns {Post}
   */
  public listenTo() {
    return Post;
  }

  /**
   * @description Called after entity insertion
   * @event
   * @create
   * @public
   * @param {InsertEvent<Post>} event
   */
  public afterInsert(event: InsertEvent<Post>) {
    this.insertCreateEvent(event.entity);
  }

  /**
   * @description Called after entity update
   * @event
   * @update
   * @public
   * @param {UpdateEvent<Post>} event
   */
  public afterUpdate(event: UpdateEvent<Post>) {
    this.insertUpdateEvent(event);
  }

  /**
   * @description Called after entity delete
   * @event
   * @remove
   * @public
   * @param {RemoveEvent<Post>} event
   */
  public afterRemove(event: RemoveEvent<Post>) {
    this.insertDeleteEvent(event.entity);
  }

  /**
   * @description Insert create post log
   * @private
   * @param {Post} event
   */
  private async insertCreateEvent(event: Post) {
    const auditLog = new PostAuditLog();
    auditLog.version = event.version;
    auditLog.postId = event.id;
    auditLog.type = EAudit.EAduitType.CREATE;
    try {
      await auditLog.save();
    } catch (error) {
      throw new InternalServerErrorException(error.message);
    }
  }

  /**
   * @description Insert update post log
   * @private
   * @param {UpdateEvent<Post>} event
   */
  private async insertUpdateEvent(event: UpdateEvent<Post>) {
    const auditLog = new PostAuditLog();
    auditLog.version = event.entity.version;
    auditLog.postId = event.entity.id;
    auditLog.type = EAudit.EAduitType.UPDATE;
    auditLog.updateAlias = event.updatedColumns.map((col) => col.databaseName).join(',');
    try {
      await auditLog.save();
    } catch (error) {
      throw new InternalServerErrorException(error.message);
    }
  }

  /**
   * @description Insert delete post log
   * @public
   * @param {Post} event
   */
  private async insertDeleteEvent(event: Post) {
    const auditLog = new PostAuditLog();
    auditLog.version = event.version;
    auditLog.postId = event.id;
    auditLog.type = EAudit.EAduitType.DELETE;
    try {
      await auditLog.save();
    } catch (error) {
      throw new InternalServerErrorException(error.message);
    }
  }
}
