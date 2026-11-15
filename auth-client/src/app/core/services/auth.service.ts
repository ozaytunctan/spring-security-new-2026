import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import { TokenService } from './token.service';
import {
  AuthResponse,
  LoginRequest,
  MessageResponse,
  RegisterRequest,
} from '../models/auth.models';

const API = 'http://localhost:8080/api/auth';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly tokens = inject(TokenService);

  login(req: LoginRequest): Observable<AuthResponse> {
    return this.http
      .post<AuthResponse>(`${API}/login`, req)
      .pipe(tap((res) => this.tokens.saveSession(res)));
  }

  register(req: RegisterRequest): Observable<MessageResponse> {
    return this.http.post<MessageResponse>(`${API}/register`, req);
  }

  /** Refresh interceptor tarafından çağrılır */
  refresh(refreshToken: string): Observable<AuthResponse> {
    return this.http
      .post<AuthResponse>(`${API}/refresh`, { refreshToken })
      .pipe(tap((res) => this.tokens.saveSession(res)));
  }

  logout(): Observable<MessageResponse> {
    const refreshToken = this.tokens.getRefreshToken();
    // Önce sunucuyu bilgilendir, sonra local temizle
    const req$ = refreshToken
      ? this.http.post<MessageResponse>(`${API}/logout`, { refreshToken })
      : (null as unknown as Observable<MessageResponse>);

    return new Observable<MessageResponse>((subscriber) => {
      const finish = () => {
        this.tokens.clear();
        subscriber.next({ message: 'Çıkış yapıldı' });
        subscriber.complete();
      };
      if (req$) {
        req$.subscribe({
          next: finish,
          error: finish, // sunucu hata verse bile local temizlenir
        });
      } else {
        finish();
      }
    });
  }

  get isAuthenticated(): boolean {
    return this.tokens.isAuthenticated;
  }
}
