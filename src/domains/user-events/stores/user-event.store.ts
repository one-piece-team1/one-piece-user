import { Injectable, Inject } from '@nestjs/common';
import { getRepository, Repository } from 'typeorm';
import { UserEvent } from '../entities/user-event.entity';

@Injectable()
export class UserEventStoreRepository {
  private readonly connName = 'eventStore';

  public constructor(
    @Inject('USEREVENT_REPOSITORY')
    private repository: Repository<UserEvent>,
  ) {}

  public async allAllUserEvent(): Promise<UserEvent[]> {
    return await getRepository(UserEvent, this.connName).find();
  }

  public async getUserEventById(id: string): Promise<UserEvent> {
    return await this.repository.findOne(id);
  }

  public async register(data: UserEvent): Promise<UserEvent | Error>;
  public async register(data: UserEvent, id: string): Promise<UserEvent | Error>;
  public async register(data: UserEvent, id?: string): Promise<UserEvent | Error> {
    if (id) {
      return await this.updateEvent(id, data);
    }
    return await this.createEvent(data);
  }

  private async createEvent(UserEventEntity: UserEvent): Promise<UserEvent | Error> {
    try {
      const event = getRepository(UserEvent, this.connName).create(UserEventEntity);
      return await getRepository(UserEvent, this.connName).save(event);
    } catch (error) {
      return new Error(error);
    }
  }

  private async updateEvent(id: string, UserEventEntity: UserEvent): Promise<UserEvent | Error> {
    try {
      await getRepository(UserEvent, this.connName).update({ id }, UserEventEntity);
      return getRepository(UserEvent, this.connName).findOne(id);
    } catch (error) {
      return new Error(error);
    }
  }
}
