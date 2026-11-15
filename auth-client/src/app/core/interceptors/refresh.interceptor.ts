import {
  HttpErrorResponse,
  HttpInterceptorFn,
} from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import {
  BehaviorSubject,
  catchError,
  filter,
  switchMap,
  take,
  throwError,
} from 'rxjs';
import { AuthService } from '../services/auth.service';
import { TokenService } from '../services/token.service';

/**
 * 401 alındığında refresh token ile access token yeniler.
 *
 * DİKKAT — Neden her 401'de refresh yapılmaz:
 * 401, "token süresi doldu" demek OLABİLİR ama her 401 süresi dolmuş
 * token anlamına gelmez (ör. backend yetki hatalarını da 401 döndürebilir).
 * Bu yüzden önce JWT'nin `exp` alanı istemci tarafında okunur:
 *
 *   - Token SÜRESİ DOLMUŞ / yakında dolacak  → refresh yap, isteği tekrar dene
 *   - Token GEÇERLİ ama 401 geldi            → yetkisizlik/istemci hatası,
 *                                               refresh YAPMA, hatayı geçir
 *
 * Aynı anda gelen çoklu 401 için tek refresh yapılır (kuyruk).
 */

/** Refresh, bitişe bu kadar süre kala başlasın (clock skew toleransı) */
const REFRESH_SKEW_MS = 30_000;

/** Token geçerli mi? (exp alanı okunur, imza doğrulanmaz — sadece ipucu) */
function isTokenExpired(token: string | null): boolean {
  if (!token) return true; // token yoksa zaten refresh gerekir
  try {
    const payload = JSON.parse(
      atob(token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/')),
    );
    if (typeof payload.exp !== 'number') return true; // exp yoksa güvenli tarafta kal
    return payload.exp * 1000 <= Date.now() + REFRESH_SKEW_MS;
  } catch {
    return true; // çözülemediyse refresh dene
  }
}

/** Kuyruk: 401 sırasında devam eden refresh'i paylaşır */
let refreshing$: BehaviorSubject<string | null> | null = null;

export const refreshInterceptor: HttpInterceptorFn = (req, next) => {
  const auth = inject(AuthService);
  const tokens = inject(TokenService);
  const router = inject(Router);

  return next(req).pipe(
    catchError((error: HttpErrorResponse) => {
      // Sadece gerçek 401'leri yakala (refresh/login isteği hariç)
      if (
        error.status !== 401 ||
        req.url.includes('/api/auth/refresh') ||
        req.url.includes('/api/auth/login')
      ) {
        return throwError(() => error);
      }

      // ❌ Token hâlâ geçerliyse refresh YAPMA:
      // bu 401 muhtemelen yetkisizlik (ya da başka bir uygulama hatası).
      // Refresh yapmak işi çözmez, sadece gereksiz trafik üretir.
      if (!isTokenExpired(tokens.getAccessToken())) {
        return throwError(() => error);
      }

      // ✅ Token süresi dolmuş → refresh ile yenile
      const refreshToken = tokens.getRefreshToken();
      if (!refreshToken) {
        return failSession(tokens, router, error);
      }

      // İlk 401'de refresh başlat; bekleyenler aynı kuyruğa yazılır
      if (!refreshing$) {
        refreshing$ = new BehaviorSubject<string | null>(null);
        const queue$ = refreshing$;

        auth.refresh(refreshToken).subscribe({
          next: (res) => {
            queue$.next(res.accessToken); // bekleyen istekleri uyandır
            queue$.complete();
            refreshing$ = null;            // sonraki 401'ler için sıfırla
          },
          error: (refreshError) => {
            queue$.error(refreshError);
            refreshing$ = null;
            tokens.clear();
            router.navigate(['/login']);
          },
        });
      }

      return refreshing$.pipe(
        filter((t): t is string => t !== null),
        take(1),
        switchMap(() => next(req)), // yenilenen token authInterceptor ekler
        catchError((retryError) => throwError(() => retryError)),
      );
    }),
  );
};

function failSession(tokens: TokenService, router: Router, err: unknown) {
  tokens.clear();
  router.navigate(['/login']);
  return throwError(() => err);
}
