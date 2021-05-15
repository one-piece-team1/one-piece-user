import { v4 as uuidv4 } from 'uuid';
import * as bcrypt from 'bcrypt';
import { User } from '../users/user.entity';
import * as EShare from '../trips/enums';

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

export function MockCreateTrip() {
  return {
    id: uuidv4(),
    startDate: new Date(),
    endDate: new Date('2050/01/01'),
    publicStatus: EShare.ETripView.PUBLIC,
    companyName: 'companyName',
    shipNumber: 'shipNumber',
    geom: {
      type: 'MultiLineString',
      coordinates: [],
    },
  };
}

export function MockCreatePost() {
  return {
    id: uuidv4(),
    content: 'test',
    image: 'https://test.com/test.png',
    publicStatus: EShare.ETripView.PUBLIC,
  };
}
