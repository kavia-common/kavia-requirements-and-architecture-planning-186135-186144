import { Component, OnInit, inject, computed } from '@angular/core';
import { NgFor, NgIf } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AppSelectors } from '../../core/state/app.selectors';
import { AppActions } from '../../core/state/app.actions';
import { ResourceItem } from '../../core/state/app.store';
import { ApiService } from '../../core/services/api.service';

/**
 * PUBLIC_INTERFACE
 * ResourcesComponent: view/edit resource allocations and optionally load from API.
 */
@Component({
  selector: 'app-resources',
  standalone: true,
  imports: [NgFor, NgIf, FormsModule],
  template: `
    <section class="container" style="padding: var(--spacing-6) 0;">
      <div class="flex" style="justify-content: space-between; margin-bottom: var(--spacing-6);">
        <h1 style="font-size: 20px; font-weight: 600;">Resources</h1>
        <div class="flex">
          <button class="btn ghost" (click)="loadFromApi()">Load</button>
          <button class="btn" (click)="startAdd()">Add</button>
        </div>
      </div>

      <div class="card" style="padding: var(--spacing-6);">
        <div class="grid" style="grid-template-columns: 1fr 1fr 160px 1fr 160px;">
          <div class="text-muted" style="font-weight: 600;">Role</div>
          <div class="text-muted" style="font-weight: 600;">Name</div>
          <div class="text-muted" style="font-weight: 600;">Allocation %</div>
          <div class="text-muted" style="font-weight: 600;">Notes</div>
          <div class="text-muted" style="font-weight: 600;">Actions</div>

          <ng-container *ngFor="let r of list()">
            <div>
              <div *ngIf="editId !== r.id; else roleEdit">{{ r.role }}</div>
              <ng-template #roleEdit>
                <input class="input" [(ngModel)]="editModel.role" aria-label="Edit role"/>
              </ng-template>
            </div>
            <div>
              <div *ngIf="editId !== r.id; else nameEdit">{{ r.name || '—' }}</div>
              <ng-template #nameEdit>
                <input class="input" [(ngModel)]="editModel.name" aria-label="Edit name"/>
              </ng-template>
            </div>
            <div>
              <div *ngIf="editId !== r.id; else allocEdit">{{ r.allocationPercent ?? '—' }}</div>
              <ng-template #allocEdit>
                <input class="input" type="number" min="0" max="100" [(ngModel)]="editModel.allocationPercent" aria-label="Edit allocation"/>
              </ng-template>
            </div>
            <div>
              <div *ngIf="editId !== r.id; else notesEdit">{{ r.notes || '—' }}</div>
              <ng-template #notesEdit>
                <input class="input" [(ngModel)]="editModel.notes" aria-label="Edit notes"/>
              </ng-template>
            </div>
            <div class="flex">
              <button *ngIf="editId !== r.id" class="btn ghost" (click)="beginEdit(r)">Edit</button>
              <button *ngIf="editId !== r.id" class="btn ghost" (click)="remove(r.id)">Delete</button>

              <button *ngIf="editId === r.id" class="btn" (click)="saveEdit()">Save</button>
              <button *ngIf="editId === r.id" class="btn ghost" (click)="cancelEdit()">Cancel</button>
            </div>
          </ng-container>

          <ng-container *ngIf="adding">
            <div><input class="input" [(ngModel)]="newItem.role" placeholder="Role" aria-label="Role"/></div>
            <div><input class="input" [(ngModel)]="newItem.name" placeholder="Name (optional)" aria-label="Name"/></div>
            <div><input class="input" type="number" min="0" max="100" [(ngModel)]="newItem.allocationPercent" placeholder="%" aria-label="Allocation"/></div>
            <div><input class="input" [(ngModel)]="newItem.notes" placeholder="Notes (optional)" aria-label="Notes"/></div>
            <div class="flex">
              <button class="btn" (click)="confirmAdd()">Add</button>
              <button class="btn ghost" (click)="cancelAdd()">Cancel</button>
            </div>
          </ng-container>
        </div>

        <div *ngIf="list().length === 0 && !adding" class="text-muted" style="margin-top: var(--spacing-6);">
          No resources yet. Click Load to fetch from API or Add to create.
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
  `]
})
export class ResourcesComponent implements OnInit {
  private readonly selectors = inject(AppSelectors);
  private readonly actions = inject(AppActions);
  private readonly api = inject(ApiService);

  list = computed(() => this.selectors.resources());

  adding = false;
  newItem: ResourceItem = { id: rid(), role: '', name: '', allocationPercent: 100, notes: '' };

  editId: string | null = null;
  editModel: ResourceItem = { id: '', role: '', name: '', allocationPercent: 0, notes: '' };

  ngOnInit(): void {
    // optional initial load could be triggered here if desired
  }

  loadFromApi(): void {
    this.api.getResources().subscribe({
      next: (resp) => {
        if (Array.isArray(resp?.data)) {
          this.actions.setUiFlags({ loading: true });
          this.selectors.resources(); // touch signal
          // Replace or upsert by just removing duplicates by id then add
          const items = resp.data.map(r => ({
            ...r,
            id: r.id || rid(),
          }));
          // Simple strategy: clear then add all
          // There's no clear method; simulate by removing each current then add
          const current = this.selectors.resources();
          for (const c of current) this.actions.removeResource(c.id);
          for (const i of items) this.actions.addResource(i);
        }
      },
      error: () => {},
      complete: () => this.actions.setUiFlags({ loading: false }),
    });
  }

  startAdd(): void {
    this.adding = true;
    this.newItem = { id: rid(), role: '', name: '', allocationPercent: 100, notes: '' };
  }
  confirmAdd(): void {
    if (!this.newItem.role.trim()) return;
    this.actions.addResource(this.newItem);
    this.adding = false;
  }
  cancelAdd(): void {
    this.adding = false;
  }

  beginEdit(r: ResourceItem): void {
    this.editId = r.id;
    this.editModel = { ...r };
  }
  saveEdit(): void {
    if (!this.editId) return;
    if (!this.editModel.role.trim()) return;
    const pct = Number(this.editModel.allocationPercent ?? 0);
    const patch: Partial<ResourceItem> = {
      role: this.editModel.role.trim(),
      name: (this.editModel.name || '').trim(),
      allocationPercent: Math.max(0, Math.min(100, isFinite(pct) ? pct : 0)),
      notes: (this.editModel.notes || '').trim(),
    };
    this.actions.updateResource(this.editId, patch);
    this.editId = null;
  }
  cancelEdit(): void { this.editId = null; }

  remove(id: string): void { this.actions.removeResource(id); }
}

function rid(): string {
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}
