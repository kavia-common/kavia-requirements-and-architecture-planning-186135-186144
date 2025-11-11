import { Routes } from '@angular/router';
import { DashboardComponent } from './features/dashboard/dashboard.component';

export const routes: Routes = [
  { path: '', pathMatch: 'full', redirectTo: 'dashboard' },
  { path: 'dashboard', loadComponent: () => import('./features/dashboard/dashboard.component').then(m => m.DashboardComponent) },
  { path: 'requirements', loadComponent: () => import('./features/placeholder/placeholder.component').then(m => m.PlaceholderComponent), data: { title: 'Requirements' } },
  { path: 'architecture', loadComponent: () => import('./features/placeholder/placeholder.component').then(m => m.PlaceholderComponent), data: { title: 'Architecture' } },
  { path: 'resources', loadComponent: () => import('./features/placeholder/placeholder.component').then(m => m.PlaceholderComponent), data: { title: 'Resources' } },
  { path: 'timeline', loadComponent: () => import('./features/placeholder/placeholder.component').then(m => m.PlaceholderComponent), data: { title: 'Timeline' } },
  { path: 'export', loadComponent: () => import('./features/placeholder/placeholder.component').then(m => m.PlaceholderComponent), data: { title: 'Export' } },
  { path: 'settings', loadComponent: () => import('./features/placeholder/placeholder.component').then(m => m.PlaceholderComponent), data: { title: 'Settings' } },
  { path: '**', redirectTo: 'dashboard' }
];
