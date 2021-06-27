type Status = 'error' | 'success';

export interface IResponseBase<T> {
  status: Status;
  statusCode: number;
  message?: T;
}

interface IEventApiResponseBase {
  id: string;
}

export interface IEventApiResponse<T> extends IEventApiResponseBase {
  status: Status;
  statusCode: number;
  message?: T;
}
