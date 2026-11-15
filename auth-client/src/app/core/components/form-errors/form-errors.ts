import { Component, input, Signal } from '@angular/core';
import { ValidationError } from '@angular/forms/signals';

/**
 * FieldTree'nin bize ihtiyacı olan minimum yüzeyi.
 * (FieldTree<any> kullanmak conditional type'ı bozduğu için
 * yapısal olarak bu dar arayüzü tipleniyoruz.)
 */
type ErrorsField = () => {
  touched: Signal<boolean>;
  errors: Signal<readonly ValidationError.WithFieldTree[]>;
};

/**
 * Reusable form hata gösterici (Signal Forms).
 *
 * Kullanım:
 *   <app-form-errors [field]="loginForm.username" />
 *   <app-form-errors [field]="registerForm" [force]="true" />
 *
 * - Alan touched olduğunda hataları listeler
 * - `message` varsa onu, yoksa `kind`'ı gösterir
 * - `[force]="true"` ile touched olmasa da göster (ör. root hatalar)
 * - Tekrar kullanılabilir: login, register veya herhangi bir form alanı
 */
@Component({
  selector: 'app-form-errors',
  templateUrl: './form-errors.html',
  styleUrl: './form-errors.css',
})
export class FormErrors {
  /** Hataları gösterilecek alan (FieldTree — çağrılarak FieldState'e ulaşılır) */
  readonly field = input.required<ErrorsField>();

  /** touched olmasa da hataları göster */
  readonly force = input(false);
}
