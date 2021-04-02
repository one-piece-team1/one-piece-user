export interface IPagingResponse {
  take: number;
  skip: number;
  count: number;
}

export interface IUsersPagingResponseBase<T> extends IPagingResponse {
  users: T;
}
