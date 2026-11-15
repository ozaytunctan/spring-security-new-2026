import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { TokenService } from '../services/token.service';

/** Giriş yapılmamışsa /login'e yönlendirir. */
export const authGuard: CanActivateFn = () => {
  const tokens = inject(TokenService);
  const router = inject(Router);

  return tokens.isAuthenticated ? true : router.createUrlTree(['/login']);
};

/** Giriş yapılmışsa /home'a yönlendirir (login/register sayfaları için). */
export const guestGuard: CanActivateFn = () => {
  const tokens = inject(TokenService);
  const router = inject(Router);

  return tokens.isAuthenticated ? router.createUrlTree(['/home']) : true;
};
