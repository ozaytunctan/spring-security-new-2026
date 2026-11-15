import { Component, inject, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { FormField, FormRoot, form, submit } from '@angular/forms/signals';
import { AuthService } from '../../core/services/auth.service';
import { RegisterModel, registerSchema } from '../../core/forms/auth.schemas';
import { FormErrors } from '../../core/components/form-errors/form-errors';

@Component({
  selector: 'app-register',
  imports: [RouterLink, FormRoot, FormField, FormErrors],
  templateUrl: './register.html',
  styleUrl: './register.css',
})
export class Register {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);

  readonly loading = signal(false);
  readonly error = signal<string | null>(null);
  readonly success = signal<string | null>(null);

  /** Model = tek doğruluk kaynağı */
  private readonly model = signal<RegisterModel>({
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
  });

  /**
   * Signal form + ortak şema.
   * Şifre tekrar eşleşmesi registerSchema'daki validateTree ile
   * cross-field olarak kontrol edilir (auth.schemas.ts).
   */
  readonly registerForm = form(this.model, registerSchema);

  submit(): void {
    this.error.set(null);
    this.success.set(null);

    void submit(this.registerForm, {
      action: async () => {
        this.loading.set(true);
        try {
          const { username, email, password } = this.model();
          const res = await firstValueFrom(
            this.auth.register({ username, email, password }),
          );
          this.success.set(
            `${res.message} — 3 sn içinde giriş sayfasına yönlendirileceksin…`,
          );
          setTimeout(() => this.router.navigate(['/login']), 3000);
        } catch (err) {
          this.error.set(this.messageOf(err as HttpErrorResponse));
        } finally {
          this.loading.set(false);
        }
        return null;
      },
      onInvalid: () => {
        this.error.set('Lütfen alanları kontrol edin');
      },
    });
  }

  private messageOf(err: HttpErrorResponse): string {
    if (err.status === 0) return 'Sunucuya ulaşılamıyor (8080 açık mı?)';
    if (typeof err.error?.message === 'string') return err.error.message;
    if (err.status === 409) return 'Bu kullanıcı adı zaten kayıtlı';
    return 'Kayıt başarısız oldu';
  }
}
