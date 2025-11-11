import { Component, computed, inject, signal } from '@angular/core';
import { NgFor, NgIf, NgClass } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AppActions } from '../../core/state/app.actions';
import { AppSelectors } from '../../core/state/app.selectors';
import { Requirement } from '../../core/state/app.store';

/**
 * PUBLIC_INTERFACE
 * RequirementsComponent provides a minimal CRUD UI for managing requirements:
 * - List requirements with status and tags
 * - Add, edit, delete items
 * - Inline editing with soft mono minimalist styles
 */
@Component({
  selector: 'app-requirements',
  standalone: true,
  imports: [NgFor, NgIf, NgClass, FormsModule],
  template: `
    <section class="container" style="padding: var(--spacing-6) 0;">
      <div class="flex" style="justify-content: space-between; margin-bottom: var(--spacing-6);">
        <h1 style="font-size: 20px; font-weight: 600;">Requirements</h1>
        <div class="flex">
          <input
            class="input"
            type="text"
            placeholder="Search title or tag..."
            [(ngModel)]="query"
            aria-label="Search requirements"
          />
          <button class="btn" type="button" (click)="startAdd()">Add</button>
        </div>
      </div>

      <div class="card" style="padding: var(--spacing-6);">
        <div class="grid" style="grid-template-columns: 1fr 160px 160px 120px;">
          <div class="text-muted" style="font-weight: 600;">Title</div>
          <div class="text-muted" style="font-weight: 600;">Status</div>
          <div class="text-muted" style="font-weight: 600;">Tags</div>
          <div class="text-muted" style="font-weight: 600;">Actions</div>

          <ng-container *ngFor="let r of filtered()">
            <div>
              <div *ngIf="editId !== r.id; else editTitle">{{ r.title }}</div>
              <ng-template #editTitle>
                <input class="input" type="text" [(ngModel)]="editModel.title" aria-label="Edit title"/>
              </ng-template>
              <div class="text-muted" *ngIf="r.description && editId !== r.id" style="font-size: 12px;">{{ r.description }}</div>
              <textarea
                *ngIf="editId === r.id"
                class="input"
                rows="2"
                [(ngModel)]="editModel.description"
                placeholder="Description (optional)"
                aria-label="Edit description"
                style="margin-top: var(--spacing-2);"
              ></textarea>
            </div>
            <div>
              <span *ngIf="editId !== r.id" class="badge" [ngClass]="statusClass(r.status || 'open')">
                {{ r.status || 'open' }}
              </span>
              <select *ngIf="editId === r.id" class="input" [(ngModel)]="editModel.status" aria-label="Edit status">
                <option value="open">open</option>
                <option value="in-progress">in-progress</option>
                <option value="done">done</option>
              </select>
            </div>
            <div>
              <div *ngIf="editId !== r.id">{{ (r.tags || []).join(', ') || '—' }}</div>
              <input *ngIf="editId === r.id" class="input" type="text" [(ngModel)]="tagsString" placeholder="comma,separated" aria-label="Edit tags"/>
            </div>
            <div class="flex">
              <button *ngIf="editId !== r.id" class="btn ghost" (click)="beginEdit(r)">Edit</button>
              <button *ngIf="editId !== r.id" class="btn ghost" (click)="remove(r.id)">Delete</button>

              <button *ngIf="editId === r.id" class="btn" (click)="saveEdit()">Save</button>
              <button *ngIf="editId === r.id" class="btn ghost" (click)="cancelEdit()">Cancel</button>
            </div>
          </ng-container>

          <ng-container *ngIf="adding">
            <div>
              <input class="input" type="text" [(ngModel)]="newModel.title" placeholder="Title" aria-label="New title"/>
              <textarea class="input" rows="2" [(ngModel)]="newModel.description" placeholder="Description (optional)" aria-label="New description" style="margin-top: var(--spacing-2);"></textarea>
            </div>
            <div>
              <select class="input" [(ngModel)]="newModel.status" aria-label="New status">
                <option value="open">open</option>
                <option value="in-progress">in-progress</option>
                <option value="done">done</option>
              </select>
            </div>
            <div>
              <input class="input" type="text" [(ngModel)]="newTags" placeholder="comma,separated" aria-label="New tags"/>
            </div>
            <div class="flex">
              <button class="btn" (click)="confirmAdd()">Add</button>
              <button class="btn ghost" (click)="cancelAdd()">Cancel</button>
            </div>
          </ng-container>
        </div>

        <div *ngIf="filtered().length === 0 && !adding" class="text-muted" style="margin-top: var(--spacing-6);">
          No requirements found. Use Add to create one.
        </div>
      </div>
    </section>
  `,
  styles: [`
    .input {
      width: 100%;
      padding: 8px 10px;
      border: 1px solid #E5E7EB;
      border-radius: var(--radius-sm);
      background: #FFF;
    }
    .badge {
      display: inline-block;
      padding: 4px 8px;
      border-radius: 9999px;
      border: 1px solid #E5E7EB;
      font-size: 12px;
      text-transform: capitalize;
      background: #F9FAFB;
    }
    .badge.success { color: var(--color-success); border-color: var(--color-success); background: #ECFDF5; }
    .badge.warn { color: #D97706; border-color: #F59E0B; background: #FFFBEB; }
    .badge.muted { color: var(--color-secondary); }
  `]
})
export class RequirementsComponent {
  private readonly actions = inject(AppActions);
  private readonly selectors = inject(AppSelectors);

  query = '';
  adding = false;
  newModel: Requirement = { id: '', title: '', description: '', status: 'open', tags: [] };
  newTags = '';

  editId: string | null = null;
  editModel: Requirement = { id: '', title: '', description: '', status: 'open', tags: [] };
  tagsString = '';

  // PUBLIC_INTERFACE
  hasUnsavedChanges(): boolean {
    /**
     * Returns true if there are potential unsaved changes:
     * - Add form is open and contains any input
     * - Edit form is active and contains any input
     */
    if (this.adding) {
      if (
        this.newModel.title?.trim() ||
        this.newModel.description?.trim() ||
        this.newTags?.trim() ||
        (this.newModel.status && this.newModel.status !== 'open')
      ) {
        return true;
      }
    }
    if (this.editId) {
      if (
        this.editModel.title?.trim() ||
        this.editModel.description?.trim() ||
        this.tagsString?.trim() ||
        (this.editModel.status && this.editModel.status !== 'open')
      ) {
        return true;
      }
    }
    return false;
  }

  filtered = computed(() => {
    const q = this.query.trim().toLowerCase();
    const list = this.selectors.requirements();
    if (!q) return list;
    return list.filter(r => {
      const inTitle = r.title.toLowerCase().includes(q);
      const inTags = (r.tags || []).some(t => t.toLowerCase().includes(q));
      return inTitle || inTags;
    });
  });

  startAdd(): void {
    this.adding = true;
    this.newModel = { id: cryptoRandom(), title: '', description: '', status: 'open', tags: [] };
    this.newTags = '';
  }

  confirmAdd(): void {
    const item: Requirement = {
      ...this.newModel,
      tags: parseTags(this.newTags),
    };
    if (!item.title.trim()) return;
    this.actions.addRequirement(item);
    this.adding = false;
  }

  cancelAdd(): void {
    this.adding = false;
  }

  beginEdit(r: Requirement): void {
    this.editId = r.id;
    this.editModel = { ...r, tags: [...(r.tags || [])] };
    this.tagsString = (r.tags || []).join(',');
  }

  saveEdit(): void {
    if (!this.editId) return;
    const patch: Partial<Requirement> = {
      title: (this.editModel.title || '').trim(),
      description: (this.editModel.description || '').trim(),
      status: this.editModel.status || 'open',
      tags: parseTags(this.tagsString),
    };
    if (!patch.title) return;
    this.actions.updateRequirement(this.editId, patch);
    this.editId = null;
  }

  cancelEdit(): void {
    this.editId = null;
  }

  remove(id: string): void {
    this.actions.removeRequirement(id);
  }

  statusClass(status: string): string {
    if (status === 'done') return 'success badge';
    if (status === 'in-progress') return 'warn badge';
    return 'muted badge';
  }
}

function parseTags(input: string): string[] {
  return input
    .split(',')
    .map(s => s.trim())
    .filter(Boolean);
}

function cryptoRandom(): string {
  try {
    // Browser crypto
    const bytes = new Uint8Array(8);
    globalThis.crypto?.getRandomValues?.(bytes);
    return Array.from(bytes).map(b => b.toString(16).padStart(2, '0')).join('');
  } catch {
    // Fallback
    return Math.random().toString(16).slice(2) + Date.now().toString(16);
  }
}
