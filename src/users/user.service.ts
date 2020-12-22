import { Injectable } from '@nestjs/common';

@Injectable()
export class UserService {
  public async getRequest(): Promise<string> {
    return 'Hello World!';
  }
}
