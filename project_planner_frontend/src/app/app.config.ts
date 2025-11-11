import { ApplicationConfig, APP_INITIALIZER, InjectionToken, provideZoneChangeDetection } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideHttpClient, withInterceptors } from '@angular/common/http';

import { routes } from './app.routes';
import { provideClientHydration, withEventReplay } from '@angular/platform-browser';
import { ConfigService } from './core/services/config.service';
import { authInterceptor } from './core/services/auth.interceptor';

/**
 * Toggle whether to enable the AuthInterceptor.
 * This can later be switched based on feature flags or environment.
 */
export const ENABLE_AUTH_INTERCEPTOR = new InjectionToken<boolean>('ENABLE_AUTH_INTERCEPTOR', {
  factory: () => true, // default to true; safe if no token is present (interceptor is no-op)
});

function initConfigFactory(config: ConfigService) {
  return () => config.init();
}

export const appConfig: ApplicationConfig = {
  providers: [
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(routes),
    // Provide HttpClient with optional auth interceptor based on token.
    {
      provide: ENABLE_AUTH_INTERCEPTOR,
      useFactory: () => true,
    },
    provideHttpClient(
      withInterceptors([
        (req, next) => authInterceptor(req, next),
      ])
    ),
    provideClientHydration(withEventReplay()),
    {
      provide: APP_INITIALIZER,
      useFactory: initConfigFactory,
      deps: [ConfigService],
      multi: true,
    },
  ]
};
