import { v4 as uuidv4 } from 'uuid';
import * as bcrypt from 'bcrypt';
import { User } from '../users/user.entity';

export async function MockUser(): Promise<User> {
  const user = new User();
  user.id = uuidv4();
  user.username = 'unit-test1';
  user.email = 'unit-test1@gmail.com';
  user.salt = await bcrypt.genSalt();
  user.password = await bcrypt.hash('Aabc123', user.salt);
  user.expiredDate = new Date();
  return user;
}
