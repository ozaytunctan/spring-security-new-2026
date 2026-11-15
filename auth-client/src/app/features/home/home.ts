import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { TokenService } from '../../core/services/token.service';
import { HasRoleDirective } from '../../core/directives/has-role.directive';
import { HasAuthorityDirective } from '../../core/directives/has-authority.directive';

interface DemoResult {
  endpoint: string;
  status: number | 'HATA';
  body: unknown;
}

/**
 * Korunan sayfa.
 * - /api/v1/demo/* çağrıları authInterceptor tarafından imzalanır
 * - 401 dönerse refreshInterceptor token yeniler ve tekrar dener
 */
@Component({
  selector: 'app-home',
  imports: [CommonModule, HasRoleDirective, HasAuthorityDirective],
  templateUrl: './home.html',
  styleUrl: './home.css',
})
export class Home {
  private readonly http = inject(HttpClient);
  private readonly auth = inject(AuthService);
  private readonly tokens = inject(TokenService);
  private readonly router = inject(Router);

  readonly username = this.tokens.username;
  readonly roles = this.tokens.roles;
  readonly results = signal<DemoResult[]>([]);
  readonly loading = signal(false);

  /** Backend'de 401 dönen uçları dener → refresh akışı gözlemlenir */
  callEndpoint(path: string): void {
    this.loading.set(true);
    this.http.get(`http://localhost:8080${path}`).subscribe({
      next: (body) => {
        this.append({ endpoint: path, status: 200, body });
        this.loading.set(false);
      },
      error: (err: { status: number; error: unknown }) => {
        this.append({ endpoint: path, status: err.status || 'HATA', body: err.error });
        this.loading.set(false);
      },
    });
  }

  /** Tüm demo uçlarını paralel dener */
  callAll(): void {
    this.results.set([]);
    ['/api/v1/demo/profile', '/api/v1/demo/user', '/api/v1/demo/admin'].forEach((p) =>
      this.callEndpoint(p),
    );
  }

  logout(): void {
    this.auth.logout().subscribe(() => this.router.navigate(['/login']));
  }

  private append(result: DemoResult): void {
    this.results.update((list) => [...list, result]);
  }
}
