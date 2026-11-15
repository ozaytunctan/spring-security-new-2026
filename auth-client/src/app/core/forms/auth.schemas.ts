import {
  apply,
  email,
  maxLength,
  minLength,
  required,
  schema,
  validateTree,
} from '@angular/forms/signals';

/**
 * Tüm auth formları için ortak şemalar.
 *
 * Angular 22 Signal Forms (@angular/forms/signals) kullanılır:
 * - `schema<T>()` → yeniden kullanılabilir kural seti
 * - `apply()`     → şemayı bir alana uygular (DRY)
 *
 * Login ve Register aynı username/password kurallarını BURADAN alır.
 */

/** Login form modeli */
export interface LoginModel {
  username: string;
  password: string;
}

/** Register form modeli */
export interface RegisterModel {
  username: string;
  email: string;
  password: string;
  confirmPassword: string;
}

/** Ortak: kullanıcı adı kuralları (login + register) */
export const usernameSchema = schema<{ username: string }>((f) => {
  required(f.username, { message: 'Kullanıcı adı gerekli' });
  minLength(f.username, 3, { message: 'En az 3 karakter olmalı' });
  maxLength(f.username, 50, { message: 'En fazla 50 karakter olabilir' });
});

/** Ortak: e-posta kuralları */
export const emailSchema = schema<{ email: string }>((f) => {
  required(f.email, { message: 'E-posta gerekli' });
  email(f.email, { message: 'Geçerli bir e-posta adresi girin' });
});

/** Ortak: şifre kuralları */
export const passwordSchema = schema<{ password: string }>((f) => {
  required(f.password, { message: 'Şifre gerekli' });
  minLength(f.password, 6, { message: 'Şifre en az 6 karakter olmalı' });
});

/** Login şeması — ortak parçalardan birleştirilir */
export const loginSchema = schema<LoginModel>((f) => {
  apply(f, usernameSchema);
  apply(f, passwordSchema);
});

/** Register şeması — ortak parçalar + şifre tekrar eşleşmesi */
export const registerSchema = schema<RegisterModel>((f) => {
  apply(f, usernameSchema);
  apply(f, emailSchema);
  apply(f, passwordSchema);

  required(f.confirmPassword, { message: 'Şifre tekrarı gerekli' });

  // Cross-field: şifre ≠ şifre tekrarı → root'a hata, confirm alanının
  // yanında gösterilir (validateTree şifre değişiminde tekrar değerlendirir)
  validateTree(f, (ctx) =>
    ctx.value().password !== ctx.value().confirmPassword
      ? { kind: 'passwordMismatch', message: 'Şifreler eşleşmiyor' }
      : null,
  );
});
