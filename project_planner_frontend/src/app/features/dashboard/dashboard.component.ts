import { Component } from '@angular/core';
import { NgFor } from '@angular/common';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [NgFor],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.css',
})
export class DashboardComponent {
  cards = [
    { title: 'Requirements', value: '12 items', tone: 'default' },
    { title: 'Architecture', value: 'Updated', tone: 'success' },
    { title: 'Resources', value: '5 roles', tone: 'default' },
    { title: 'Timeline', value: 'Q4 2025', tone: 'default' },
  ];
}
