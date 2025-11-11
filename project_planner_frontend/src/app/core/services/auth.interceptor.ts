import { HttpEvent, HttpHandlerFn, HttpInterceptorFn, HttpRequest } from '@angular/common/http';
import { inject, isDevMode } from '@angular/core';
import { Observable } from 'rxjs';
import { ConfigService } from './config.service';

/**
 * Optional Auth Interceptor:
 * - Attaches Authorization header if an auth token is available (placeholder behavior).
 * - Kept minimal and SSR-safe.
 * - Toggle usage via provider flag in app.config.ts.
 */
export const authInterceptor: HttpInterceptorFn = (req: HttpRequest<unknown>, next: HttpHandlerFn): Observable<HttpEvent<unknown>> => {
  const config = inject(ConfigService);

  // Placeholder token retrieval (future integration can replace this logic).
  // Avoid direct window usage for SSR safety.
  let token: string | null = null;
  try {
    const g = globalThis as unknown as { localStorage?: { getItem(k: string): string | null } };
    token = g?.localStorage?.getItem('auth_token') ?? null;
  } catch {
    // ignore
  }

  if (token) {
    const cloned = req.clone({
      setHeaders: {
        Authorization: `Bearer ${token}`,
      },
      withCredentials: true,
    });
    return next(cloned);
  }

  // Ensure withCredentials for same-site scenarios if apiBase is relative
  const isRelative = (config.backendUrl?.() || '').trim() === '';
  if (isRelative && !req.withCredentials) {
    return next(req.clone({ withCredentials: true }));
  }

  if (isDevMode() && !req.url.includes('/config.json')) {
    // Light dev hint; avoid noisy logs.
    // console.debug('[AuthInterceptor] Passing through request:', req.url);
  }

  return next(req);
};
