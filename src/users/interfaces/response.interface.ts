export interface ResponseBase {
  statusCode: number;
  status: 'error' | 'success';
  message: any;
  [futureKey: string]: any;
}

export interface SignInResponse extends ResponseBase {
  accessToken?: string;
}
