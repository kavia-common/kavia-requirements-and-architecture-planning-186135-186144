import { Injectable, inject } from '@angular/core';
import { CanDeactivateFn } from '@angular/router';

/**
 * Hook interface for components that can indicate "dirty" state (unsaved changes).
 * Components should implement hasUnsavedChanges() to return true when user changes are not yet saved/applied.
 */
export interface CanComponentDeactivate {
  // PUBLIC_INTERFACE
  hasUnsavedChanges: () => boolean;
}

/**
 * SSR-safe confirm that attempts to use window.confirm on the browser.
 * On the server (SSR/prerender), it defaults to allowing navigation (returning true) to avoid blocking render.
 */
function ssrSafeConfirm(message: string): boolean {
  try {
    const g = globalThis as unknown as { confirm?: (msg: string) => boolean };
    if (typeof g?.confirm === 'function') {
      return g.confirm(message);
    }
  } catch {
    // ignore
  }
  // During SSR or if confirm is unavailable, do not block
  return true;
}

/**
 * PUBLIC_INTERFACE
 * UnsavedChangesGuard: A functional CanDeactivate guard that calls a component's hasUnsavedChanges()
 * to determine whether to prompt the user before navigating away.
 *
 * Usage:
 * - Have the component implement CanComponentDeactivate with hasUnsavedChanges(): boolean
 * - Add this guard to the route's canDeactivate array.
 */
export const UnsavedChangesGuard: CanDeactivateFn<CanComponentDeactivate> = (component) => {
  if (component && typeof component.hasUnsavedChanges === 'function') {
    const dirty = component.hasUnsavedChanges();
    if (dirty) {
      return ssrSafeConfirm(
        'You have unsaved changes. Are you sure you want to leave this page?'
      );
    }
  }
  return true;
};
