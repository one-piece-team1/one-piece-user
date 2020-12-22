import { Injectable } from '@nestjs/common';

@Injectable()
export class UserService {
  public async getRequest(): Promise<string> {
    return 'Hello World!';
  }

  public async postRequest(): Promise<string> {
    return 'Hello World!';
  }

  public async putRequest(id: number): Promise<string> {
    return 'Hello World' + id;
  }

  public async delRequest(id: number): Promise<string> {
    return 'Hello World' + id;
  }
}
