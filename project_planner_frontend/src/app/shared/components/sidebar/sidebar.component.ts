import { Component } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { NgFor } from '@angular/common';

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [RouterLink, RouterLinkActive, NgFor],
  templateUrl: './sidebar.component.html',
  styleUrl: './sidebar.component.css',
})
export class SidebarComponent {
  readonly links = [
    { path: '/dashboard', label: 'Dashboard' },
    { path: '/requirements', label: 'Requirements' },
    { path: '/architecture', label: 'Architecture' },
    { path: '/resources', label: 'Resources' },
    { path: '/timeline', label: 'Timeline' },
    { path: '/export', label: 'Export' },
    { path: '/settings', label: 'Settings' },
  ];
}
