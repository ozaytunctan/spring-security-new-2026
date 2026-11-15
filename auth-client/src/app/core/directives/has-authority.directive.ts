import { Directive, TemplateRef, ViewContainerRef, effect, inject, input } from '@angular/core';
import { TokenService } from '../services/token.service';

/**
 * Structural directive: belirtilen authority'ye sahipse içeriği gösterir.
 *
 * Kullanım:
 *   <button *appHasAuthority="'TODO_WRITE'">Ekle</button>
 *   <span *appHasAuthority="['TODO_WRITE', 'TODO_DELETE']">...</span>
 *
 * Spring Security'daki hasAuthority ile aynı mantık.
 * Authority'lerde prefix EKLENMEZ (doğrudan eşleşir).
 */
@Directive({
  selector: '[appHasAuthority]',
  standalone: true,
})
export class HasAuthorityDirective {
  private readonly templateRef = inject(TemplateRef<unknown>);
  private readonly viewContainer = inject(ViewContainerRef);
  private readonly tokens = inject(TokenService);

  /** *appHasAuthority="..." mikrosözdiziminden gelen değer */
  readonly appHasAuthority = input<string | string[]>();

  private hasView = false;

  constructor() {
    effect(() => {
      const required = this.normalize(this.appHasAuthority());
      const owned = this.tokens.authorities(); // signal okunur → reaktif

      const allowed =
        required.length > 0 &&
        required.some((authority) => owned.includes(authority));

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
}
