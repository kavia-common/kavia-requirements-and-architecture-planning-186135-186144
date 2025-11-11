import { Component, inject } from '@angular/core';
import { NgIf, DatePipe } from '@angular/common';
import { ApiService, PlanPayload } from '../../core/services/api.service';
import { AppSelectors } from '../../core/state/app.selectors';
import { AppActions } from '../../core/state/app.actions';

/**
 * PUBLIC_INTERFACE
 * ExportComponent: Save current plan and export as JSON, PDF, or DOCX.
 */
@Component({
  selector: 'app-export',
  standalone: true,
  imports: [NgIf, DatePipe],
  template: `
    <section class="container" style="padding: var(--spacing-6) 0;">
      <h1 style="font-size: 20px; font-weight: 600; margin-bottom: var(--spacing-6);">Export</h1>

      <div class="card" style="padding: var(--spacing-6);">
        <p class="text-muted" style="margin-bottom: var(--spacing-6);">
          Save your current plan and export it to share with stakeholders.
        </p>

        <div class="flex" style="margin-bottom: var(--spacing-6);">
          <button class="btn" (click)="save()">Save plan</button>
          <span class="text-muted" *ngIf="lastSavedAt">Last saved: {{ lastSavedAt | date: 'medium' }}</span>
        </div>

        <div class="flex">
          <button class="btn ghost" (click)="export('json')">Export JSON</button>
          <button class="btn ghost" (click)="export('pdf')">Export PDF</button>
          <button class="btn ghost" (click)="export('docx')">Export DOCX</button>
        </div>

        <div *ngIf="message" style="margin-top: var(--spacing-6);" [class.text-success]="ok" [class.text-error]="!ok">
          {{ message }}
        </div>
      </div>
    </section>
  `
})
export class ExportComponent {
  private readonly api = inject(ApiService);
  private readonly selectors = inject(AppSelectors);
  private readonly actions = inject(AppActions);

  message = '';
  ok = false;
  get lastSavedAt(): string | undefined {
    return this.selectors.ui().lastSavedAt;
  }

  // PUBLIC_INTERFACE
  save(): void {
    /** Save the current plan to backend */
    const payload: PlanPayload = {
      requirements: this.selectors.requirements(),
      architecture: this.selectors.architecture(),
      resources: this.selectors.resources(),
      timeline: this.selectors.timeline(),
    };

    this.actions.setUiFlags({ loading: true });
    this.api.savePlan(payload).subscribe({
      next: (resp) => {
        if (resp?.data) {
          const ts = (resp.data as any).savedAt || new Date().toISOString();
          this.actions.setUiFlags({ lastSavedAt: ts, loading: false });
          this.message = 'Plan saved successfully.';
          this.ok = true;
        } else {
          this.message = 'Plan saved (no response data).';
          this.ok = true;
          this.actions.setUiFlags({ loading: false });
        }
      },
      error: (e) => {
        this.message = e?.error?.message || 'Failed to save plan.';
        this.ok = false;
        this.actions.setUiFlags({ loading: false });
      }
    });
  }

  // PUBLIC_INTERFACE
  export(format: 'json' | 'pdf' | 'docx'): void {
    /** Export the plan and trigger download (json direct, blobs for others). */
    this.message = '';
    this.ok = false;

    this.api.exportPlan(format).subscribe({
      next: (resp) => {
        if (!resp) {
          this.message = 'Export failed.';
          this.ok = false;
          return;
        }

        if (format === 'json') {
          const data = resp.data || {};
          const g = globalThis as any;
          const BlobCtor = g?.Blob ?? undefined;
          const blob = BlobCtor ? new BlobCtor([JSON.stringify(data, null, 2)], { type: 'application/json' }) : null;
          if (blob) triggerDownload(blob, `plan.${format}`);
        } else {
          const g = globalThis as any;
          const blob: any = resp.data as any;
          if (g && blob) triggerDownload(blob, `plan.${format}`);
        }

        this.message = `Exported ${format.toUpperCase()} successfully.`;
        this.ok = true;
      },
      error: (e) => {
        this.message = e?.error?.message || `Export ${format.toUpperCase()} failed.`;
        this.ok = false;
      }
    });
  }
}

function triggerDownload(blob: any, filename: string): void {
  try {
    const g: any = (globalThis as any) || {};
    const URLRef: any = g.URL || g.webkitURL;
    const doc: any = g.document;
    if (!URLRef || !doc || !doc.createElement) return;
    const url = URLRef.createObjectURL(blob);
    const a = doc.createElement('a');
    if (!a) return;
    a.href = url;
    a.download = filename;
    a.rel = 'noopener';
    if (doc.body?.appendChild) doc.body.appendChild(a);
    if (typeof a.click === 'function') a.click();
    if (doc.body?.removeChild) doc.body.removeChild(a);
    if (typeof URLRef.revokeObjectURL === 'function') {
      if (typeof g.setTimeout === 'function') g.setTimeout(() => URLRef.revokeObjectURL(url), 1000);
      else URLRef.revokeObjectURL(url);
    }
  } catch {
    // ignore
  }
}
