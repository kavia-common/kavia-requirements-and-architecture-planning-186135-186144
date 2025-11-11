import { inject, Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse, HttpHeaders, HttpParams } from '@angular/common/http';
import { catchError, map, Observable, of, throwError } from 'rxjs';
import { ConfigService } from './config.service';
import { ArchitectureItem, Requirement, ResourceItem, TimelineMilestone } from '../state/app.store';

/**
 * API models and helper types
 */
export interface PlanPayload {
  requirements: Requirement[];
  architecture: ArchitectureItem[];
  resources: ResourceItem[];
  timeline: TimelineMilestone[];
}

/**
 * A generic API response envelope if needed later.
 */
export interface ApiResponse<T> {
  data: T;
  error?: { code?: string | number; message: string };
}

/**
 * Centralized helper to normalize errors from HttpErrorResponse into a human-friendly shape.
 */
function toApiError(err: unknown): { status?: number; message: string } {
  if (err instanceof HttpErrorResponse) {
    const status = err.status ?? undefined;
    // Try to extract message from common payload shapes
    const payloadMsg =
      (typeof err.error === 'string' && err.error) ||
      (err.error?.message as string | undefined) ||
      (err.message ?? undefined);
    return {
      status,
      message: payloadMsg || 'Request failed',
    };
  }
  return { message: 'Unknown error' };
}

@Injectable({ providedIn: 'root' })
export class ApiService {
  private readonly http = inject(HttpClient);
  private readonly config = inject(ConfigService);

  /**
   * Compute the base URL safely.
   * If backendUrl is configured, prefer `${backendUrl}${apiBase}`, otherwise use relative `apiBase`.
   * Do not assume trailing slashes; normalize carefully.
   */
  private baseUrl(): string {
    const apiBase = (this.config.apiBase?.() || '/api').replace(/\/+$/, '');
    const backend = (this.config.backendUrl?.() || '').replace(/\/+$/, '');
    return backend ? `${backend}${apiBase}` : apiBase;
  }

  private buildUrl(path: string): string {
    const p = path.startsWith('/') ? path : `/${path}`;
    return `${this.baseUrl()}${p}`;
  }

  private jsonHeaders(): HttpHeaders {
    return new HttpHeaders({ 'Content-Type': 'application/json; charset=utf-8' });
  }

  // PUBLIC_INTERFACE
  getPlan(): Observable<ApiResponse<PlanPayload>> {
    /** Fetch the current plan from the backend. */
    const url = this.buildUrl('/plan');
    return this.http.get<PlanPayload>(url, { withCredentials: true }).pipe(
      map((data) => ({ data })),
      catchError((err) => {
        const e = toApiError(err);
        return of({ data: { requirements: [], architecture: [], resources: [], timeline: [] }, error: { message: e.message, code: e.status } });
      })
    );
  }

  // PUBLIC_INTERFACE
  savePlan(payload: PlanPayload): Observable<ApiResponse<{ ok: true; savedAt: string }>> {
    /** Save the provided plan payload to the backend. */
    const url = this.buildUrl('/plan');
    return this.http
      .post<{ ok: true; savedAt: string }>(url, payload, {
        withCredentials: true,
        headers: this.jsonHeaders(),
      })
      .pipe(
        map((data) => ({ data: data as { ok: true; savedAt: string } })),
        catchError((err) => {
          const e = toApiError(err);
          return throwError(() => ({ error: { message: e.message, code: e.status } }));
        })
      );
  }

  // PUBLIC_INTERFACE
  exportPlan(format: 'pdf' | 'docx' | 'json' = 'json'): Observable<ApiResponse<unknown | object>> {
    /**
     * Request an export of the plan.
     * - For 'json', return parsed JSON object.
     * - For binary exports (pdf/docx), return a Blob for the caller to download.
     */
    const url = this.buildUrl('/export');
    const params = new HttpParams().set('format', format);

    if (format === 'json') {
      return this.http.get<object>(url, { params, withCredentials: true }).pipe(
        map((data) => ({ data })),
        catchError((err) => {
          const e = toApiError(err);
          return throwError(() => ({ error: { message: e.message, code: e.status } }));
        })
      );
    }

    return this.http
      .get(url, {
        params,
        withCredentials: true,
        responseType: 'blob',
      })
      .pipe(
        map((data) => ({ data })),
        catchError((err) => {
          const e = toApiError(err);
          return throwError(() => ({ error: { message: e.message, code: e.status } }));
        })
      );
  }

  // PUBLIC_INTERFACE
  getResources(): Observable<ApiResponse<ResourceItem[]>> {
    /** Fetch a list of available resources from the backend. */
    const url = this.buildUrl('/resources');
    return this.http.get<ResourceItem[]>(url, { withCredentials: true }).pipe(
      map((data) => ({ data })),
      catchError((err) => {
        const e = toApiError(err);
        // Degrade gracefully with empty list
        return of({ data: [], error: { message: e.message, code: e.status } });
      })
    );
  }
}
