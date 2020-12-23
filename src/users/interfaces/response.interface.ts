export interface ResponseBase {
  statusCode: number;
  status: 'error' | 'success';
  message: any;
}

export interface SignInResponse extends ResponseBase {
  accessToken?: string;
}
