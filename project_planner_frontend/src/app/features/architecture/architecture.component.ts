import { Component, computed, inject } from '@angular/core';
import { NgFor, NgIf } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AppSelectors } from '../../core/state/app.selectors';
import { AppActions } from '../../core/state/app.actions';
import { ArchitectureItem } from '../../core/state/app.store';

/**
 * PUBLIC_INTERFACE
 * ArchitectureComponent: edit a simple list of architecture items (title, type, links).
 */
@Component({
  selector: 'app-architecture',
  standalone: true,
  imports: [NgFor, NgIf, FormsModule],
  template: `
    <section class="container" style="padding: var(--spacing-6) 0;">
      <div class="flex" style="justify-content: space-between; margin-bottom: var(--spacing-6);">
        <h1 style="font-size: 20px; font-weight: 600;">Architecture</h1>
        <button class="btn" (click)="startAdd()">Add</button>
      </div>

      <div class="card" style="padding: var(--spacing-6);">
        <div class="grid" style="grid-template-columns: 1fr 180px 1fr 160px;">
          <div class="text-muted" style="font-weight: 600;">Title</div>
          <div class="text-muted" style="font-weight: 600;">Type</div>
          <div class="text-muted" style="font-weight: 600;">Links</div>
          <div class="text-muted" style="font-weight: 600;">Actions</div>

          <ng-container *ngFor="let a of list()">
            <div>
              <div *ngIf="editId !== a.id; else editTitle">{{ a.title }}</div>
              <ng-template #editTitle>
                <input class="input" [(ngModel)]="editModel.title" aria-label="Edit title"/>
                <textarea class="input" rows="2" [(ngModel)]="editModel.description" placeholder="Description (optional)" aria-label="Edit description" style="margin-top: var(--spacing-2);"></textarea>
              </ng-template>
            </div>
            <div>
              <span *ngIf="editId !== a.id" class="badge muted">{{ a.type || 'other' }}</span>
              <select *ngIf="editId === a.id" class="input" [(ngModel)]="editModel.type" aria-label="Edit type">
                <option value="component">component</option>
                <option value="service">service</option>
                <option value="database">database</option>
                <option value="integration">integration</option>
                <option value="other">other</option>
              </select>
            </div>
            <div>
              <div *ngIf="editId !== a.id">{{ (a.links || []).join(', ') || '—' }}</div>
              <input *ngIf="editId === a.id" class="input" [(ngModel)]="editLinks" placeholder="comma,separated URLs" aria-label="Edit links"/>
            </div>
            <div class="flex">
              <button *ngIf="editId !== a.id" class="btn ghost" (click)="beginEdit(a)">Edit</button>
              <button *ngIf="editId !== a.id" class="btn ghost" (click)="remove(a.id)">Delete</button>

              <button *ngIf="editId === a.id" class="btn" (click)="saveEdit()">Save</button>
              <button *ngIf="editId === a.id" class="btn ghost" (click)="cancelEdit()">Cancel</button>
            </div>
          </ng-container>

          <ng-container *ngIf="adding">
            <div>
              <input class="input" [(ngModel)]="newItem.title" placeholder="Title" aria-label="Title"/>
              <textarea class="input" rows="2" [(ngModel)]="newItem.description" placeholder="Description (optional)" aria-label="Description" style="margin-top: var(--spacing-2);"></textarea>
            </div>
            <div>
              <select class="input" [(ngModel)]="newItem.type" aria-label="Type">
                <option value="component">component</option>
                <option value="service">service</option>
                <option value="database">database</option>
                <option value="integration">integration</option>
                <option value="other">other</option>
              </select>
            </div>
            <div>
              <input class="input" [(ngModel)]="newLinks" placeholder="comma,separated URLs" aria-label="Links"/>
            </div>
            <div class="flex">
              <button class="btn" (click)="confirmAdd()">Add</button>
              <button class="btn ghost" (click)="cancelAdd()">Cancel</button>
            </div>
          </ng-container>
        </div>

        <div *ngIf="list().length === 0 && !adding" class="text-muted" style="margin-top: var(--spacing-6);">
          No architecture items yet. Add components, services, databases or integrations.
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
      text-transform: lowercase;
      background: #F9FAFB;
    }
    .badge.muted { color: var(--color-secondary); }
  `]
})
export class ArchitectureComponent {
  private selectors = inject(AppSelectors);
  private actions = inject(AppActions);

  list = computed(() => this.selectors.architecture());

  adding = false;
  newItem: ArchitectureItem = { id: randomId(), title: '', description: '', type: 'component', links: [] };
  newLinks = '';

  editId: string | null = null;
  editModel: ArchitectureItem = { id: '', title: '', description: '', type: 'component', links: [] };
  editLinks = '';

  // PUBLIC_INTERFACE
  hasUnsavedChanges(): boolean {
    // Consider dirty if add form is open with any content or edit form has any content
    if (this.adding) {
      if (
        this.newItem.title?.trim() ||
        this.newItem.description?.trim() ||
        this.newLinks.trim() ||
        (this.newItem.type && this.newItem.type !== 'component')
      ) return true;
    }
    if (this.editId) {
      if (
        this.editModel.title?.trim() ||
        this.editModel.description?.trim() ||
        this.editLinks.trim() ||
        (this.editModel.type && this.editModel.type !== 'component')
      ) return true;
    }
    return false;
  }

  startAdd(): void {
    this.adding = true;
    this.newItem = { id: randomId(), title: '', description: '', type: 'component', links: [] };
    this.newLinks = '';
  }
  confirmAdd(): void {
    if (!this.newItem.title.trim()) return;
    const item: ArchitectureItem = { ...this.newItem, links: parseCsv(this.newLinks) };
    this.actions.addArchitecture(item);
    this.adding = false;
  }
  cancelAdd(): void { this.adding = false; }

  beginEdit(a: ArchitectureItem): void {
    this.editId = a.id;
    this.editModel = { ...a, links: [...(a.links || [])] };
    this.editLinks = (a.links || []).join(',');
  }
  saveEdit(): void {
    if (!this.editId) return;
    const patch: Partial<ArchitectureItem> = {
      title: (this.editModel.title || '').trim(),
      description: (this.editModel.description || '').trim(),
      type: this.editModel.type || 'other',
      links: parseCsv(this.editLinks),
    };
    if (!patch.title) return;
    this.actions.updateArchitecture(this.editId, patch);
    this.editId = null;
  }
  cancelEdit(): void { this.editId = null; }

  remove(id: string): void { this.actions.removeArchitecture(id); }
}

function parseCsv(s: string): string[] {
  return s.split(',').map(x => x.trim()).filter(Boolean);
}
function randomId(): string {
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}
