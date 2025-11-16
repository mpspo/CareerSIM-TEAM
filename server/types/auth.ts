export interface Session {
  username: string;
  created: number;
}

export interface LoginRequest {
  username: string;
  password: string;
}

export interface RegisterRequest {
  username: string;
  password: string;
  study?: string;
  target?: string;
}

export interface LoginResponse {
  token: string;
  username: string;
  study?: string;
  target?: string;
}
