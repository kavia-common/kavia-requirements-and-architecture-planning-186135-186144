import { Routes } from '@angular/router';
import { UnsavedChangesGuard } from './core/services/unsaved-changes.guard';

export const routes: Routes = [
  { path: '', pathMatch: 'full', redirectTo: 'dashboard' },
  { path: 'dashboard', loadComponent: () => import('./features/dashboard/dashboard.component').then(m => m.DashboardComponent) },
  {
    path: 'requirements',
    loadComponent: () => import('./features/requirements/requirements.component').then(m => m.RequirementsComponent),
    canDeactivate: [UnsavedChangesGuard],
  },
  {
    path: 'architecture',
    loadComponent: () => import('./features/architecture/architecture.component').then(m => m.ArchitectureComponent),
    canDeactivate: [UnsavedChangesGuard],
  },
  {
    path: 'resources',
    loadComponent: () => import('./features/resources/resources.component').then(m => m.ResourcesComponent),
    canDeactivate: [UnsavedChangesGuard],
  },
  {
    path: 'timeline',
    loadComponent: () => import('./features/timeline/timeline.component').then(m => m.TimelineComponent),
    canDeactivate: [UnsavedChangesGuard],
  },
  { path: 'export', loadComponent: () => import('./features/export/export.component').then(m => m.ExportComponent) },
  { path: 'settings', loadComponent: () => import('./features/settings/settings.component').then(m => m.SettingsComponent) },
  { path: '**', redirectTo: 'dashboard' }
];
