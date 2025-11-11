import { Component } from '@angular/core';
import { ActivatedRoute } from '@angular/router';

@Component({
  selector: 'app-placeholder',
  standalone: true,
  template: `
    <section class="container" style="padding: 24px 0;">
      <div class="card" style="padding: 24px;">
        <h1 style="font-size: 20px; font-weight: 600; margin-bottom: 8px;">
          {{ title || 'Section' }}
        </h1>
        <p class="text-muted">This section is under construction. Use the sidebar to navigate.</p>
      </div>
    </section>
  `
})
export class PlaceholderComponent {
  readonly title: string | undefined;

  constructor(route: ActivatedRoute) {
    // Resolve the title once from route data in a template-friendly way (no inline casting).
    this.title = (route.snapshot.data && (route.snapshot.data['title'] as string)) || undefined;
  }
}
