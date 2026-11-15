import { Component, inject, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { FormField, FormRoot, form, submit } from '@angular/forms/signals';
import { AuthService } from '../../core/services/auth.service';
import { LoginModel, loginSchema } from '../../core/forms/auth.schemas';
import { FormErrors } from '../../core/components/form-errors/form-errors';

@Component({
  selector: 'app-login',
  imports: [RouterLink, FormRoot, FormField, FormErrors],
  templateUrl: './login.html',
  styleUrl: './login.css',
})
export class Login {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);

  readonly loading = signal(false);
  readonly error = signal<string | null>(null);

  /** Model = tek doğruluk kaynağı; form bunun üzerine kurulur. */
  private readonly model = signal<LoginModel>({ username: '', password: '' });

  /** Signal form + ortak şema (auth.schemas.ts'den gelir) */
  readonly loginForm = form(this.model, loginSchema);

  submit(): void {
    this.error.set(null);

    // submit(): invalid ise field'ları touched işaretler, valid ise action çalışır
    void submit(this.loginForm, {
      action: async () => {
        this.loading.set(true);
        try {
          await firstValueFrom(this.auth.login(this.model()));
          this.router.navigate(['/home']);
        } catch (err) {
          this.error.set(this.messageOf(err as HttpErrorResponse));
        } finally {
          this.loading.set(false);
        }
        return null; // sunucu hatası form validasyonu değil → hata ayrı gösterilir
      },
      onInvalid: () => {
        this.error.set('Lütfen alanları kontrol edin');
      },
    });
  }

  private messageOf(err: HttpErrorResponse): string {
    if (err.status === 0) return 'Sunucuya ulaşılamıyor (8080 açık mı?)';
    if (err.status === 401) return 'Kullanıcı adı veya şifre hatalı';
    if (typeof err.error?.message === 'string') return err.error.message;
    return 'Giriş başarısız oldu';
  }
}
