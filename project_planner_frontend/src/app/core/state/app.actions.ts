/**
 * Action helpers for the AppStore.
 * These are thin wrappers around AppStore methods to keep components decoupled from internal method names,
 * and to centralize any future cross-cutting concerns (analytics, logging, batching).
 */
import { inject, Injectable } from '@angular/core';
import { AppStore, Requirement, ArchitectureItem, ResourceItem, TimelineMilestone, UiFlags } from './app.store';

// PUBLIC_INTERFACE
@Injectable({ providedIn: 'root' })
export class AppActions {
  /** This service exposes app-wide actions that update the signal store. */
  private readonly store = inject(AppStore);

  // Requirements
  // PUBLIC_INTERFACE
  addRequirement(req: Requirement): void {
    /** Add a new requirement to the store. */
    this.store.addRequirement(req);
  }

  // PUBLIC_INTERFACE
  updateRequirement(id: string, patch: Partial<Requirement>): void {
    /** Update an existing requirement. */
    this.store.updateRequirement(id, patch);
  }

  // PUBLIC_INTERFACE
  removeRequirement(id: string): void {
    /** Remove a requirement by id. */
    this.store.removeRequirement(id);
  }

  // PUBLIC_INTERFACE
  upsertRequirements(items: Requirement[]): void {
    /** Upsert a list of requirements. */
    this.store.upsertRequirements(items);
  }

  // Architecture
  // PUBLIC_INTERFACE
  addArchitecture(item: ArchitectureItem): void {
    /** Add an architecture item. */
    this.store.addArchitecture(item);
  }

  // PUBLIC_INTERFACE
  updateArchitecture(id: string, patch: Partial<ArchitectureItem>): void {
    /** Update architecture item by id. */
    this.store.updateArchitecture(id, patch);
  }

  // PUBLIC_INTERFACE
  removeArchitecture(id: string): void {
    /** Remove architecture item by id. */
    this.store.removeArchitecture(id);
  }

  // Resources
  // PUBLIC_INTERFACE
  addResource(item: ResourceItem): void {
    /** Add a resource assignment. */
    this.store.addResource(item);
  }

  // PUBLIC_INTERFACE
  updateResource(id: string, patch: Partial<ResourceItem>): void {
    /** Update resource assignment by id. */
    this.store.updateResource(id, patch);
  }

  // PUBLIC_INTERFACE
  removeResource(id: string): void {
    /** Remove resource assignment by id. */
    this.store.removeResource(id);
  }

  // Timeline
  // PUBLIC_INTERFACE
  addMilestone(item: TimelineMilestone): void {
    /** Add a timeline milestone. */
    this.store.addMilestone(item);
  }

  // PUBLIC_INTERFACE
  updateMilestone(id: string, patch: Partial<TimelineMilestone>): void {
    /** Update milestone by id. */
    this.store.updateMilestone(id, patch);
  }

  // PUBLIC_INTERFACE
  removeMilestone(id: string): void {
    /** Remove milestone by id. */
    this.store.removeMilestone(id);
  }

  // UI
  // PUBLIC_INTERFACE
  setUiFlags(patch: Partial<UiFlags>): void {
    /** Set UI flags (sidebar, darkMode, loading...). */
    this.store.setUiFlags(patch);
  }

  // PUBLIC_INTERFACE
  reset(): void {
    /** Reset the store to initial defaults. */
    this.store.reset();
  }
}
