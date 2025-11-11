import { computed, inject, Injectable, isDevMode, signal } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { PLATFORM_ID } from '@angular/core';
import { ConfigService } from '../services/config.service';

/**
 * Domain models for the planning app.
 */
export interface Requirement {
  id: string;
  title: string;
  description?: string;
  status?: 'open' | 'in-progress' | 'done';
  tags?: string[];
}

export interface ArchitectureItem {
  id: string;
  title: string;
  description?: string;
  type?: 'component' | 'service' | 'database' | 'integration' | 'other';
  links?: string[];
}

export interface ResourceItem {
  id: string;
  role: string;
  name?: string;
  allocationPercent?: number; // 0-100
  notes?: string;
}

export interface TimelineMilestone {
  id: string;
  title: string;
  dueDate: string; // ISO string
  status?: 'planned' | 'at-risk' | 'done';
  notes?: string;
}

export interface UiFlags {
  sidebarOpen: boolean;
  darkMode: boolean;
  loading: boolean;
  lastSavedAt?: string; // ISO date for display
}

export interface AppState {
  requirements: Requirement[];
  architecture: ArchitectureItem[];
  resources: ResourceItem[];
  timeline: TimelineMilestone[];
  ui: UiFlags;
}

/**
 * Storage keys and helpers.
 */
const STORAGE_KEY = 'app_state_v1';

/**
 * A small, framework-native store built on Angular signals.
 * - Keeps separate slices for requirements, architecture, resources, timeline, and ui flags.
 * - Provides CRUD helpers as methods.
 * - Optionally persists to localStorage, gated by a feature flag from ConfigService.
 * - Fully SSR-safe (guards window/localStorage access).
 */
@Injectable({ providedIn: 'root' })
export class AppStore {
  private readonly platformId = inject(PLATFORM_ID);
  private readonly config = inject(ConfigService);

  // Internal state signal (private)
  private readonly _state = signal<AppState>({
    requirements: [],
    architecture: [],
    resources: [],
    timeline: [],
    ui: {
      sidebarOpen: true,
      darkMode: false,
      loading: false,
      lastSavedAt: undefined,
    },
  });

  // Derived/computed helpers (public getters or computed signals)
  readonly state = computed(() => this._state());

  readonly requirements = computed(() => this._state().requirements);
  readonly architecture = computed(() => this._state().architecture);
  readonly resources = computed(() => this._state().resources);
  readonly timeline = computed(() => this._state().timeline);
  readonly ui = computed(() => this._state().ui);

  private get persistenceEnabled(): boolean {
    const flags = this.config.featureFlags();
    // Feature flag key: 'persistLocalState'
    // If missing, default to false to be conservative for SSR and privacy.
    return !!flags['persistLocalState'];
  }

  constructor() {
    // Initialize from localStorage if enabled and in browser
    if (this.persistenceEnabled) {
      const restored = this.safeLoad();
      if (restored) {
        this._state.set(restored);
      }
    }

    // Subscribe to changes for persistence when enabled
    if (this.persistenceEnabled && isPlatformBrowser(this.platformId)) {
      // Using an effect would require injecting from @angular/core effect; for simplicity,
      // we'll persist lazily on every write through dedicated persist() calls below.
      // This keeps the store lightweight and avoids extra effect setup.
    }
  }

  private safeLoad(): AppState | null {
    if (!isPlatformBrowser(this.platformId)) return null;
    try {
      // Avoid direct DOM lib types (like Storage) to keep lint happy in SSR context
      const w = globalThis as unknown as { localStorage?: { getItem(key: string): string | null } };
      const raw = w?.localStorage?.getItem(STORAGE_KEY) ?? null;
      if (!raw) return null;
      const parsed = JSON.parse(raw) as Partial<AppState>;
      return this.normalize(parsed);
    } catch {
      return null;
    }
  }

  private safeSave(state: AppState): void {
    if (!isPlatformBrowser(this.platformId)) return;
    try {
      const w = globalThis as unknown as { localStorage?: { setItem(key: string, value: string): void } };
      w?.localStorage?.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch {
      // ignore quota or serialization errors
      if (isDevMode()) {
        console.warn('Failed to persist to localStorage');
      }
    }
  }

  private persist(): void {
    if (this.persistenceEnabled) {
      this.safeSave(this._state());
      // Update lastSavedAt for UI
      this._state.update(s => ({
        ...s,
        ui: { ...s.ui, lastSavedAt: new Date().toISOString() },
      }));
    }
  }

  private normalize(p: Partial<AppState>): AppState {
    return {
      requirements: Array.isArray(p.requirements) ? (p.requirements as Requirement[]) : [],
      architecture: Array.isArray(p.architecture) ? (p.architecture as ArchitectureItem[]) : [],
      resources: Array.isArray(p.resources) ? (p.resources as ResourceItem[]) : [],
      timeline: Array.isArray(p.timeline) ? (p.timeline as TimelineMilestone[]) : [],
      ui: {
        sidebarOpen: !!p.ui?.sidebarOpen,
        darkMode: !!p.ui?.darkMode,
        loading: !!p.ui?.loading,
        lastSavedAt: p.ui?.lastSavedAt ?? undefined,
      },
    };
  }

  // PUBLIC_INTERFACE
  addRequirement(item: Requirement): void {
    /** Add a requirement item to the requirements slice. */
    this._state.update(s => ({
      ...s,
      requirements: [...s.requirements, item],
    }));
    this.persist();
  }

  // PUBLIC_INTERFACE
  updateRequirement(id: string, patch: Partial<Requirement>): void {
    /** Update an existing requirement by ID with the fields in patch. */
    this._state.update(s => ({
      ...s,
      requirements: s.requirements.map(r => (r.id === id ? { ...r, ...patch } : r)),
    }));
    this.persist();
  }

  // PUBLIC_INTERFACE
  removeRequirement(id: string): void {
    /** Remove a requirement by ID. */
    this._state.update(s => ({
      ...s,
      requirements: s.requirements.filter(r => r.id !== id),
    }));
    this.persist();
  }

  // PUBLIC_INTERFACE
  upsertRequirements(items: Requirement[]): void {
    /** Replace all requirements or merge by id if already present. */
    this._state.update(s => {
      const byId = new Map(s.requirements.map(r => [r.id, r]));
      for (const it of items) byId.set(it.id, { ...(byId.get(it.id) ?? {}), ...it });
      return { ...s, requirements: Array.from(byId.values()) };
    });
    this.persist();
  }

  // PUBLIC_INTERFACE
  addArchitecture(item: ArchitectureItem): void {
    /** Add an architecture item. */
    this._state.update(s => ({
      ...s,
      architecture: [...s.architecture, item],
    }));
    this.persist();
  }

  // PUBLIC_INTERFACE
  updateArchitecture(id: string, patch: Partial<ArchitectureItem>): void {
    /** Update an architecture item by ID. */
    this._state.update(s => ({
      ...s,
      architecture: s.architecture.map(a => (a.id === id ? { ...a, ...patch } : a)),
    }));
    this.persist();
  }

  // PUBLIC_INTERFACE
  removeArchitecture(id: string): void {
    /** Remove an architecture item by ID. */
    this._state.update(s => ({
      ...s,
      architecture: s.architecture.filter(a => a.id !== id),
    }));
    this.persist();
  }

  // PUBLIC_INTERFACE
  addResource(item: ResourceItem): void {
    /** Add a resource allocation item. */
    this._state.update(s => ({
      ...s,
      resources: [...s.resources, item],
    }));
    this.persist();
  }

  // PUBLIC_INTERFACE
  updateResource(id: string, patch: Partial<ResourceItem>): void {
    /** Update a resource allocation item by ID. */
    this._state.update(s => ({
      ...s,
      resources: s.resources.map(r => (r.id === id ? { ...r, ...patch } : r)),
    }));
    this.persist();
  }

  // PUBLIC_INTERFACE
  removeResource(id: string): void {
    /** Remove a resource allocation item by ID. */
    this._state.update(s => ({
      ...s,
      resources: s.resources.filter(r => r.id !== id),
    }));
    this.persist();
  }

  // PUBLIC_INTERFACE
  addMilestone(item: TimelineMilestone): void {
    /** Add a timeline milestone. */
    this._state.update(s => ({
      ...s,
      timeline: [...s.timeline, item],
    }));
    this.persist();
  }

  // PUBLIC_INTERFACE
  updateMilestone(id: string, patch: Partial<TimelineMilestone>): void {
    /** Update a timeline milestone by ID. */
    this._state.update(s => ({
      ...s,
      timeline: s.timeline.map(m => (m.id === id ? { ...m, ...patch } : m)),
    }));
    this.persist();
  }

  // PUBLIC_INTERFACE
  removeMilestone(id: string): void {
    /** Remove a timeline milestone by ID. */
    this._state.update(s => ({
      ...s,
      timeline: s.timeline.filter(m => m.id !== id),
    }));
    this.persist();
  }

  // PUBLIC_INTERFACE
  setUiFlags(patch: Partial<UiFlags>): void {
    /** Update UI flags. Useful for toggling sidebar, dark mode, or loading state. */
    this._state.update(s => ({
      ...s,
      ui: { ...s.ui, ...patch },
    }));
    if ('lastSavedAt' in patch) {
      // if explicitly set, do not overwrite via persist
      if (this.persistenceEnabled) this.safeSave(this._state());
      return;
    }
    this.persist();
  }

  // PUBLIC_INTERFACE
  reset(): void {
    /** Reset the entire store to initial defaults (does not clear localStorage unless disabled). */
    const initial: AppState = {
      requirements: [],
      architecture: [],
      resources: [],
      timeline: [],
      ui: {
        sidebarOpen: true,
        darkMode: false,
        loading: false,
        lastSavedAt: undefined,
      },
    };
    this._state.set(initial);
    this.persist();
  }
}
