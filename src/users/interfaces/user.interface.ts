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
  [futureKey: string]: any;
}

export interface IQueryPaging extends IPage {
  select?: any[];
  [futureKey: string]: any;
}
