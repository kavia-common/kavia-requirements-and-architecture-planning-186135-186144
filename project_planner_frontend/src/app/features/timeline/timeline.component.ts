import { Component, computed, inject } from '@angular/core';
import { NgFor, NgIf, DatePipe, NgClass } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AppSelectors } from '../../core/state/app.selectors';
import { AppActions } from '../../core/state/app.actions';
import { TimelineMilestone } from '../../core/state/app.store';

/**
 * PUBLIC_INTERFACE
 * TimelineComponent: manage milestones with due dates and statuses.
 */
@Component({
  selector: 'app-timeline',
  standalone: true,
  imports: [NgFor, NgIf, FormsModule, DatePipe, NgClass],
  template: `
    <section class="container" style="padding: var(--spacing-6) 0;">
      <div class="flex" style="justify-content: space-between; margin-bottom: var(--spacing-6);">
        <h1 style="font-size: 20px; font-weight: 600;">Timeline</h1>
        <button class="btn" (click)="startAdd()">Add milestone</button>
      </div>

      <div class="card" style="padding: var(--spacing-6);">
        <div class="grid" style="grid-template-columns: 1fr 180px 140px 1fr 160px;">
          <div class="text-muted" style="font-weight: 600;">Title</div>
          <div class="text-muted" style="font-weight: 600;">Due Date</div>
          <div class="text-muted" style="font-weight: 600;">Status</div>
          <div class="text-muted" style="font-weight: 600;">Notes</div>
          <div class="text-muted" style="font-weight: 600;">Actions</div>

          <ng-container *ngFor="let m of list()">
            <div>
              <div *ngIf="editId !== m.id; else titleEdit">{{ m.title }}</div>
              <ng-template #titleEdit>
                <input class="input" [(ngModel)]="editModel.title" aria-label="Edit title"/>
              </ng-template>
            </div>
            <div>
              <div *ngIf="editId !== m.id; else dateEdit">{{ m.dueDate | date: 'mediumDate' }}</div>
              <ng-template #dateEdit>
                <input class="input" type="date" [(ngModel)]="editDate" aria-label="Edit due date"/>
              </ng-template>
            </div>
            <div>
              <span *ngIf="editId !== m.id" class="badge" [ngClass]="statusClass(m.status || 'planned')">{{ m.status || 'planned' }}</span>
              <select *ngIf="editId === m.id" class="input" [(ngModel)]="editModel.status" aria-label="Edit status">
                <option value="planned">planned</option>
                <option value="at-risk">at-risk</option>
                <option value="done">done</option>
              </select>
            </div>
            <div>
              <div *ngIf="editId !== m.id; else notesEdit">{{ m.notes || '—' }}</div>
              <ng-template #notesEdit>
                <input class="input" [(ngModel)]="editModel.notes" aria-label="Edit notes"/>
              </ng-template>
            </div>
            <div class="flex">
              <button *ngIf="editId !== m.id" class="btn ghost" (click)="beginEdit(m)">Edit</button>
              <button *ngIf="editId !== m.id" class="btn ghost" (click)="remove(m.id)">Delete</button>

              <button *ngIf="editId === m.id" class="btn" (click)="saveEdit()">Save</button>
              <button *ngIf="editId === m.id" class="btn ghost" (click)="cancelEdit()">Cancel</button>
            </div>
          </ng-container>

          <ng-container *ngIf="adding">
            <div><input class="input" [(ngModel)]="newItem.title" placeholder="Title" aria-label="Title"/></div>
            <div><input class="input" type="date" [(ngModel)]="newDate" aria-label="Due date"/></div>
            <div>
              <select class="input" [(ngModel)]="newItem.status" aria-label="Status">
                <option value="planned">planned</option>
                <option value="at-risk">at-risk</option>
                <option value="done">done</option>
              </select>
            </div>
            <div><input class="input" [(ngModel)]="newItem.notes" placeholder="Notes (optional)" aria-label="Notes"/></div>
            <div class="flex">
              <button class="btn" (click)="confirmAdd()">Add</button>
              <button class="btn ghost" (click)="cancelAdd()">Cancel</button>
            </div>
          </ng-container>
        </div>

        <div *ngIf="list().length === 0 && !adding" class="text-muted" style="margin-top: var(--spacing-6);">
          No milestones yet. Add planned milestones with dates.
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
    .badge.done { color: var(--color-success); border-color: var(--color-success); background: #ECFDF5; }
    .badge.at-risk { color: #D97706; border-color: #F59E0B; background: #FFFBEB; }
    .badge.planned { color: var(--color-secondary); }
  `]
})
export class TimelineComponent {
  private selectors = inject(AppSelectors);
  private actions = inject(AppActions);

  list = computed(() => this.selectors.timeline());

  adding = false;
  newItem: TimelineMilestone = { id: id(), title: '', dueDate: new Date().toISOString().slice(0,10), status: 'planned', notes: '' };
  newDate = this.newItem.dueDate;

  editId: string | null = null;
  editModel: TimelineMilestone = { id: '', title: '', dueDate: '', status: 'planned', notes: '' };
  editDate = '';

  startAdd(): void {
    this.adding = true;
    const today = new Date().toISOString().slice(0,10);
    this.newItem = { id: id(), title: '', dueDate: today, status: 'planned', notes: '' };
    this.newDate = today;
  }
  confirmAdd(): void {
    if (!this.newItem.title.trim()) return;
    const iso = toIsoDate(this.newDate);
    this.actions.addMilestone({ ...this.newItem, dueDate: iso });
    this.adding = false;
  }
  cancelAdd(): void { this.adding = false; }

  beginEdit(m: TimelineMilestone): void {
    this.editId = m.id;
    this.editModel = { ...m };
    this.editDate = (m.dueDate || '').slice(0,10);
  }
  saveEdit(): void {
    if (!this.editId) return;
    const patch: Partial<TimelineMilestone> = {
      title: (this.editModel.title || '').trim(),
      dueDate: toIsoDate(this.editDate),
      status: this.editModel.status || 'planned',
      notes: (this.editModel.notes || '').trim(),
    };
    if (!patch.title) return;
    this.actions.updateMilestone(this.editId, patch);
    this.editId = null;
  }
  cancelEdit(): void { this.editId = null; }
  remove(id: string): void { this.actions.removeMilestone(id); }

  statusClass(s: string): string {
    if (s === 'done') return 'done';
    if (s === 'at-risk') return 'at-risk';
    return 'planned';
  }
}

function id(): string { return Math.random().toString(36).slice(2) + Date.now().toString(36); }
function toIsoDate(dateStr: string): string {
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return new Date().toISOString();
    return new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate())).toISOString();
  } catch { return new Date().toISOString(); }
}
