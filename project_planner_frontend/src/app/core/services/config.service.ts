import { inject, Injectable, PLATFORM_ID } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { isPlatformBrowser } from '@angular/common';
import { firstValueFrom, of } from 'rxjs';

export type FeatureFlags = Record<string, boolean>;

export interface AppConfig {
  apiBase: string;
  backendUrl: string;
  frontendUrl: string;
  wsUrl: string;
  nodeEnv: string;
  telemetryDisabled: boolean;
  enableSourceMaps: boolean;
  port: number;
  trustProxy: boolean;
  logLevel: 'trace' | 'debug' | 'info' | 'warn' | 'error' | 'silent' | string;
  healthcheckPath: string;
  featureFlags: FeatureFlags;
  experimentsEnabled: boolean;
}

const DEFAULT_CONFIG: AppConfig = {
  apiBase: '/api',
  backendUrl: '',
  frontendUrl: '',
  wsUrl: '',
  nodeEnv: 'production',
  telemetryDisabled: true,
  enableSourceMaps: false,
  port: 4000,
  trustProxy: false,
  logLevel: 'info',
  healthcheckPath: '/healthz',
  featureFlags: {},
  experimentsEnabled: false,
};

@Injectable({ providedIn: 'root' })
export class ConfigService {
  private readonly http = inject(HttpClient);
  private readonly platformId = inject(PLATFORM_ID);

  private loaded = false;
  private config: AppConfig = { ...DEFAULT_CONFIG };

  /**
   * PUBLIC_INTERFACE
   * Initialize the configuration by fetching /config.json at runtime.
   * On SSR or any failure, safe defaults are used.
   */
  async init(): Promise<void> {
    if (this.loaded) return;
    try {
      // SSR-safe: Only try to fetch in browser; on server, use defaults.
      if (isPlatformBrowser(this.platformId)) {
        const cfg = await firstValueFrom(
          this.http.get<AppConfig>('/config.json', { withCredentials: false }).pipe(
            // On 404 or any error, continue with defaults instead of throwing
            // We can't use catchError directly without importing; wrap with firstValueFrom try/catch
          )
        );
        if (cfg && typeof cfg === 'object') {
          this.config = this.normalize(cfg);
        }
      }
    } catch {
      // Swallow and keep defaults for robustness in SSR/prerender/dev
      this.config = this.normalize(DEFAULT_CONFIG);
    } finally {
      this.loaded = true;
    }
  }

  private normalize(cfg: Partial<AppConfig>): AppConfig {
    // Ensure all keys exist and have correct types
    return {
      apiBase: cfg.apiBase ?? DEFAULT_CONFIG.apiBase,
      backendUrl: cfg.backendUrl ?? DEFAULT_CONFIG.backendUrl,
      frontendUrl: cfg.frontendUrl ?? DEFAULT_CONFIG.frontendUrl,
      wsUrl: cfg.wsUrl ?? DEFAULT_CONFIG.wsUrl,
      nodeEnv: cfg.nodeEnv ?? DEFAULT_CONFIG.nodeEnv,
      telemetryDisabled: toBool(cfg.telemetryDisabled, DEFAULT_CONFIG.telemetryDisabled),
      enableSourceMaps: toBool(cfg.enableSourceMaps, DEFAULT_CONFIG.enableSourceMaps),
      port: toNumber(cfg.port, DEFAULT_CONFIG.port),
      trustProxy: toBool(cfg.trustProxy, DEFAULT_CONFIG.trustProxy),
      logLevel: (cfg.logLevel as AppConfig['logLevel']) ?? DEFAULT_CONFIG.logLevel,
      healthcheckPath: cfg.healthcheckPath ?? DEFAULT_CONFIG.healthcheckPath,
      featureFlags: (cfg.featureFlags as FeatureFlags) ?? DEFAULT_CONFIG.featureFlags,
      experimentsEnabled: toBool(cfg.experimentsEnabled, DEFAULT_CONFIG.experimentsEnabled),
    };
  }

  /** PUBLIC_INTERFACE */
  get values(): AppConfig {
    return this.config;
  }

  /** PUBLIC_INTERFACE */
  apiBase(): string {
    /** Returns the base path for API calls; defaults to '/api'. */
    return this.config.apiBase || '/api';
  }

  /** PUBLIC_INTERFACE */
  backendUrl(): string {
    /** Returns backend absolute URL when provided; else empty for relative API. */
    return this.config.backendUrl || '';
  }

  /** PUBLIC_INTERFACE */
  frontendUrl(): string {
    /** Returns the frontend URL (useful for constructing absolute links). */
    return this.config.frontendUrl || '';
  }

  /** PUBLIC_INTERFACE */
  wsUrl(): string {
    /** Returns the WebSocket base URL for real-time endpoints. */
    return this.config.wsUrl || '';
  }

  /** PUBLIC_INTERFACE */
  nodeEnv(): string {
    /** Returns the node environment string. */
    return this.config.nodeEnv || 'production';
  }

  /** PUBLIC_INTERFACE */
  telemetryDisabled(): boolean {
    /** Returns whether telemetry is disabled. */
    return !!this.config.telemetryDisabled;
  }

  /** PUBLIC_INTERFACE */
  enableSourceMaps(): boolean {
    /** Returns whether source maps should be enabled. */
    return !!this.config.enableSourceMaps;
  }

  /** PUBLIC_INTERFACE */
  port(): number {
    /** Returns configured port (used primarily by SSR server). */
    return Number(this.config.port || 4000);
  }

  /** PUBLIC_INTERFACE */
  trustProxy(): boolean {
    /** Returns whether to trust proxy headers on SSR server. */
    return !!this.config.trustProxy;
  }

  /** PUBLIC_INTERFACE */
  logLevel(): string {
    /** Returns logging level for SSR server or client logging. */
    return this.config.logLevel || 'info';
  }

  /** PUBLIC_INTERFACE */
  healthcheckPath(): string {
    /** Returns healthcheck path for SSR server (default /healthz). */
    return this.config.healthcheckPath || '/healthz';
  }

  /** PUBLIC_INTERFACE */
  featureFlags(): FeatureFlags {
    /** Returns feature flags dictionary. */
    return this.config.featureFlags || {};
  }

  /** PUBLIC_INTERFACE */
  experimentsEnabled(): boolean {
    /** Returns whether experiments are enabled. */
    return !!this.config.experimentsEnabled;
  }
}

function toBool(value: unknown, fallback: boolean): boolean {
  if (typeof value === 'boolean') return value;
  if (typeof value === 'string') {
    const v = value.toLowerCase().trim();
    if (['true', '1', 'yes', 'y'].includes(v)) return true;
    if (['false', '0', 'no', 'n'].includes(v)) return false;
  }
  if (typeof value === 'number') return value !== 0;
  return fallback;
}

function toNumber(value: unknown, fallback: number): number {
  if (typeof value === 'number' && !Number.isNaN(value)) return value;
  if (typeof value === 'string') {
    const n = Number(value);
    if (!Number.isNaN(n)) return n;
  }
  return fallback;
}
