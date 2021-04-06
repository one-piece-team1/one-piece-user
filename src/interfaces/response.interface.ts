type Status = 'error' | 'success';

export interface IResponseBase<T> {
  status: Status;
  statusCode: number;
  message?: T;
}
