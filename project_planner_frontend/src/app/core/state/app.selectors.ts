/**
 * Signal-based selectors that read from the AppStore and derive convenient views of the state.
 * Components can inject AppSelectors to get computed signals that update reactively.
 */
import { computed, Injectable, inject } from '@angular/core';
import { AppStore, Requirement, TimelineMilestone } from './app.store';

// PUBLIC_INTERFACE
@Injectable({ providedIn: 'root' })
export class AppSelectors {
  /** This service exposes read-only computed signals for the application state. */
  private readonly store = inject(AppStore);

  // Base slice selectors (pass-through from store for convenience)
  // PUBLIC_INTERFACE
  requirements = this.store.requirements;
  // PUBLIC_INTERFACE
  architecture = this.store.architecture;
  // PUBLIC_INTERFACE
  resources = this.store.resources;
  // PUBLIC_INTERFACE
  timeline = this.store.timeline;
  // PUBLIC_INTERFACE
  ui = this.store.ui;

  // Derived selectors

  // PUBLIC_INTERFACE
  openRequirements = computed<Requirement[]>(() =>
    this.store.requirements().filter(r => (r.status ?? 'open') === 'open')
  );
  // PUBLIC_INTERFACE
  inProgressRequirements = computed<Requirement[]>(() =>
    this.store.requirements().filter(r => r.status === 'in-progress')
  );
  // PUBLIC_INTERFACE
  doneRequirements = computed<Requirement[]>(() =>
    this.store.requirements().filter(r => r.status === 'done')
  );

  // PUBLIC_INTERFACE
  totalRequirementsCount = computed<number>(() => this.store.requirements().length);

  // PUBLIC_INTERFACE
  milestonesDueSoon = computed<TimelineMilestone[]>(() => {
    const now = Date.now();
    const twoWeeks = 14 * 24 * 60 * 60 * 1000;
    return this.store
      .timeline()
      .filter(m => m.status !== 'done')
      .filter(m => {
        const due = Date.parse(m.dueDate);
        return Number.isFinite(due) && due - now <= twoWeeks && due - now >= 0;
      })
      .sort((a, b) => Date.parse(a.dueDate) - Date.parse(b.dueDate));
  });

  // PUBLIC_INTERFACE
  isLoading = computed<boolean>(() => !!this.store.ui().loading);
}
