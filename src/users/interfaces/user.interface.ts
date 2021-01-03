import * as EUser from '../enums';

type TSort = 'ASC' | 'DESC';
export type TMailType = 'forget' | 'facebook' | 'google';
export interface UserInfo {
  id?: string;
  role?: string;
  username?: string;
  email?: string;
  licence?: string;
  expiredDate?: string;
  [futureKey: string]: any;
}

export interface IPage {
  take?: number;
  skip?: number;
}
export interface ISearch extends IPage {
  keyword?: string;
  sort?: TSort;
  [futureKey: string]: any;
}

export interface IQueryPaging extends IPage {
  select?: any[];
  order: {
    [futureKey: string]: TSort;
  };
  where?: {
    [futureKey: string]: any;
  };
  [futureKey: string]: any;
}

export interface IFindOne {
  id?: string;
  username?: any;
  email?: string;
  status?: boolean;
  role?: EUser.EUserRole;
  [futureKey: string]: any;
}
