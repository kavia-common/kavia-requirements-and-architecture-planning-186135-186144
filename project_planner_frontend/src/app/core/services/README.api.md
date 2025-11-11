ApiService overview

- ApiService centralizes HTTP calls and uses ConfigService.apiBase() to build the base URL. It is SSR-safe.
- Methods:
  - getPlan(): Observable<ApiResponse<PlanPayload>>
  - savePlan(payload: PlanPayload): Observable<ApiResponse<{ ok: true; savedAt: string }>>
  - exportPlan(format: 'pdf' | 'docx' | 'json'): Observable<ApiResponse<Blob | object>>
  - getResources(): Observable<ApiResponse<ResourceItem[]>>

Interceptors
- auth.interceptor.ts is optional and attaches Authorization: Bearer <token> if localStorage contains 'auth_token'.
- It is wired by default in app.config.ts with provideHttpClient(withInterceptors([authInterceptor])).
