export interface JwtBase {
  iat?: number;
  exp?: number;
  iss?: string;
}

export interface JwtPayload extends JwtBase {
  id?: string;
  username: string;
  licence?: string;
  email?: string;
  role?: string;
}
