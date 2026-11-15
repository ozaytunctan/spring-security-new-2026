import { Directive, TemplateRef, ViewContainerRef, effect, inject, input } from '@angular/core';
import { TokenService } from '../services/token.service';

/**
 * Structural directive: belirtilen role sahipse içeriği gösterir.
 *
 * Kullanım:
 *   <div *appHasRole="'ADMIN'">Yönetici paneli</div>
 *   <div *appHasRole="['ADMIN', 'USER']">Admin veya user</div>
 *
 * Spring Security'daki *hasRole ile aynı mantık.
 * Rol yokluğunda otomatik gizlenir (reaktif: giriş/çıkışta güncellenir).
 */
@Directive({
  selector: '[appHasRole]',
  standalone: true,
})
export class HasRoleDirective {
  private readonly templateRef = inject(TemplateRef<unknown>);
  private readonly viewContainer = inject(ViewContainerRef);
  private readonly tokens = inject(TokenService);

  /** *appHasRole="..." mikrosözdiziminden gelen değer */
  readonly appHasRole = input<string | string[]>();

  private hasView = false;

  constructor() {
    effect(() => {
      const required = this.normalize(this.appHasRole());
      const owned = this.tokens.roles(); // signal okunur → reaktif

      const allowed =
        required.length > 0 &&
        required.some((role) => owned.includes(this.withPrefix(role)));

      this.toggle(allowed);
    });
  }

  private toggle(show: boolean): void {
    if (show && !this.hasView) {
      this.viewContainer.createEmbeddedView(this.templateRef);
      this.hasView = true;
    } else if (!show && this.hasView) {
      this.viewContainer.clear();
      this.hasView = false;
    }
  }

  private normalize(value: string | string[] | undefined): string[] {
    if (!value) return [];
    return Array.isArray(value) ? value : [value];
  }

  /** "ADMIN" → "ROLE_ADMIN" (Spring convention, "ROLE_" zaten varsa dokunma) */
  private withPrefix(role: string): string {
    return role.startsWith('ROLE_') ? role : `ROLE_${role}`;
  }
}
