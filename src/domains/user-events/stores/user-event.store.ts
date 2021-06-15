import { Injectable, Inject } from '@nestjs/common';
import { Repository } from 'typeorm';
import { UserEvent } from '../entities/user-event.entity';

@Injectable()
export class UserEventStoreRepository {
  public constructor(
    @Inject('USEREVENT_REPOSITORY')
    private repository: Repository<UserEvent>,
  ) {}

  public async allAllUserEvent(): Promise<UserEvent[]> {
    return await this.repository.find();
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
      const event = this.repository.create(UserEventEntity);
      return await this.repository.save(event);
    } catch (error) {
      return new Error(error);
    }
  }

  private async updateEvent(id: string, UserEventEntity: UserEvent): Promise<UserEvent | Error> {
    try {
      await this.repository.update({ id }, UserEventEntity);
      return this.repository.findOne(id);
    } catch (error) {
      return new Error(error);
    }
  }
}
