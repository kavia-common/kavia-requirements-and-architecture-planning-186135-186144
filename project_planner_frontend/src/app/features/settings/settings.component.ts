import { Component, inject } from '@angular/core';
import { AppSelectors } from '../../core/state/app.selectors';
import { AppActions } from '../../core/state/app.actions';
import { ConfigService } from '../../core/services/config.service';

/**
 * PUBLIC_INTERFACE
 * SettingsComponent: minimal settings toggles for UI flags and displays runtime config snapshot.
 */
@Component({
  selector: 'app-settings',
  standalone: true,
  imports: [],
  template: `
    <section class="container" style="padding: var(--spacing-6) 0;">
      <h1 style="font-size: 20px; font-weight: 600; margin-bottom: var(--spacing-6);">Settings</h1>

      <div class="card" style="padding: var(--spacing-6); margin-bottom: var(--spacing-6);">
        <h2 style="font-size: 16px; font-weight: 600; margin-bottom: var(--spacing-3);">Appearance</h2>
        <div class="flex" style="justify-content: space-between;">
          <label class="text-muted" for="dark">Dark mode</label>
          <input id="dark" type="checkbox" [checked]="selectors.ui().darkMode" (change)="toggleDark($event)" />
        </div>
        <div class="text-muted" style="margin-top: var(--spacing-3); font-size: 12px;">
          Note: Dark mode is a placeholder toggle for future theming.
        </div>
      </div>

      <div class="card" style="padding: var(--spacing-6);">
        <h2 style="font-size: 16px; font-weight: 600; margin-bottom: var(--spacing-3);">Runtime Config</h2>
        <div class="text-muted" style="font-size: 14px;">
          <div>API Base: <strong>{{ cfg.apiBase() }}</strong></div>
          <div>Backend URL: <strong>{{ cfg.backendUrl() || 'relative' }}</strong></div>
          <div>Frontend URL: <strong>{{ cfg.frontendUrl() || 'auto' }}</strong></div>
          <div>WS URL: <strong>{{ cfg.wsUrl() || 'n/a' }}</strong></div>
          <div>Env: <strong>{{ cfg.nodeEnv() }}</strong></div>
          <div>Healthcheck: <strong>{{ cfg.healthcheckPath() }}</strong></div>
        </div>
      </div>
    </section>
  `
})
export class SettingsComponent {
  selectors = inject(AppSelectors);
  actions = inject(AppActions);
  cfg = inject(ConfigService);

  toggleDark(ev: any): void {
    const checked = !!ev?.target?.checked;
    this.actions.setUiFlags({ darkMode: checked });
  }
}
