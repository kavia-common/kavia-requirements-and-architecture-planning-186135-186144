import { Component, inject } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector: 'app-topbar',
  standalone: true,
  imports: [],
  templateUrl: './topbar.component.html',
  styleUrl: './topbar.component.css',
})
export class TopbarComponent {
  private router = inject(Router);

  // PUBLIC_INTERFACE
  navigateTo(path: string): void {
    /** Navigate to a route without using browser globals (SSR safe). */
    this.router.navigate([path]);
  }
}
