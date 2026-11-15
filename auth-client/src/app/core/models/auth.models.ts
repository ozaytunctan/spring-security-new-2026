/** Backend DTO'ları ile eşleşen tipler */

export interface LoginRequest {
  username: string;
  password: string;
}

export interface RegisterRequest {
  username: string;
  email: string;
  password: string;
  roles?: string[];
}

export interface RefreshTokenRequest {
  refreshToken: string;
}

/** Backend AuthResponse */
export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  tokenType: string;
  username: string;
  roles: string[];
  authorities: string[];
}

/** Backend MessageResponse */
export interface MessageResponse {
  message: string;
}
