import { Injectable, signal } from '@angular/core';
import { AuthResponse } from '../models/auth.models';

const ACCESS_KEY = 'access_token';
const REFRESH_KEY = 'refresh_token';
const USER_KEY = 'auth_user';
const ROLES_KEY = 'auth_roles';
const AUTHORITIES_KEY = 'auth_authorities';

/**
 * Token ve kullanıcı bilgisinin tek kaynağı.
 * Signal ile tutulur; UI otomatik güncellenir.
 */
@Injectable({ providedIn: 'root' })
export class TokenService {
  private readonly _username = signal<string | null>(this.read(USER_KEY));
  private readonly _accessToken = signal<string | null>(localStorage.getItem(ACCESS_KEY));
  private readonly _roles = signal<string[]>(
    this.readList(ROLES_KEY),
  );
  private readonly _authorities = signal<string[]>(
    this.readList(AUTHORITIES_KEY),
  );

  /** Giriş yapılmışsa username, değilse null */
  readonly username = this._username.asReadonly();
  readonly accessToken = this._accessToken.asReadonly();
  readonly roles = this._roles.asReadonly();
  readonly authorities = this._authorities.asReadonly();

  get isAuthenticated(): boolean {
    return !!this._accessToken();
  }

  saveSession(res: AuthResponse): void {
    localStorage.setItem(ACCESS_KEY, res.accessToken);
    localStorage.setItem(REFRESH_KEY, res.refreshToken);
    localStorage.setItem(USER_KEY, res.username);
    localStorage.setItem(ROLES_KEY, JSON.stringify(res.roles ?? []));
    localStorage.setItem(
      AUTHORITIES_KEY,
      JSON.stringify(res.authorities ?? []),
    );
    this._accessToken.set(res.accessToken);
    this._username.set(res.username);
    this._roles.set(res.roles ?? []);
    this._authorities.set(res.authorities ?? []);
  }

  /** Refresh sonrası sadece access token güncellenir */
  updateAccessToken(accessToken: string): void {
    localStorage.setItem(ACCESS_KEY, accessToken);
    this._accessToken.set(accessToken);
  }

  getAccessToken(): string | null {
    return localStorage.getItem(ACCESS_KEY);
  }

  getRefreshToken(): string | null {
    return localStorage.getItem(REFRESH_KEY);
  }

  clear(): void {
    localStorage.removeItem(ACCESS_KEY);
    localStorage.removeItem(REFRESH_KEY);
    localStorage.removeItem(USER_KEY);
    localStorage.removeItem(ROLES_KEY);
    localStorage.removeItem(AUTHORITIES_KEY);
    this._accessToken.set(null);
    this._username.set(null);
    this._roles.set([]);
    this._authorities.set([]);
  }

  private read(key: string): string | null {
    return localStorage.getItem(key);
  }

  private readList(key: string): string[] {
    try {
      const raw = localStorage.getItem(key);
      return raw ? (JSON.parse(raw) as string[]) : [];
    } catch {
      return [];
    }
  }
}
