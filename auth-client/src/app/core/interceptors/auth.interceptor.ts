import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { TokenService } from '../services/token.service';

/**
 * Her isteğe Authorization: Bearer <token> ekler.
 * /api/auth istekleri hariç (login/refresh'e token gerekmez).
 */
export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const tokens = inject(TokenService);
  const token = tokens.getAccessToken();

  const isAuthEndpoint = req.url.includes('/api/auth/');

  if (token && !isAuthEndpoint) {
    req = req.clone({
      setHeaders: { Authorization: `Bearer ${token}` },
    });
  }

  return next(req);
};
