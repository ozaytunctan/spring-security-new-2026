import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { TokenService } from '../services/token.service';

/** Belirli role sahip değilse /home'a geri gönderir. */
export const roleGuard = (requiredRole: string): CanActivateFn => {
  return () => {
    const tokens = inject(TokenService);
    const router = inject(Router);

    // Rolleri JWT'den okumak yerine basit tutuyoruz:
    // istenirse JWT decode edilerek genişletilebilir.
    const roles = tokens.roles();
    return roles.includes(requiredRole)
      ? true
      : router.createUrlTree(['/home']);
  };
};
