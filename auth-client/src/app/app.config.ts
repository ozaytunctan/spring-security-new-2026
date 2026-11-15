import { ApplicationConfig, provideBrowserGlobalErrorListeners } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideHttpClient, withInterceptors } from '@angular/common/http';

import { routes } from './app.routes';
import { authInterceptor } from './core/interceptors/auth.interceptor';
import { refreshInterceptor } from './core/interceptors/refresh.interceptor';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideRouter(routes),

    // Sıra önemli: authInterceptor token'ı ekler,
    // refreshInterceptor 401'de yenileyip tekrar dener.
    provideHttpClient(
      withInterceptors([authInterceptor, refreshInterceptor]),
    ),
  ],
};
