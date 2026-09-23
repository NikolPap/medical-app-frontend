import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { InitialPipe } from '../../../../core/pipes/appointment-status-pipe';

@Component({
  selector: 'app-dashboard-header',
  standalone: true,
  imports: [CommonModule, InitialPipe],
  templateUrl: './dashboard-header.html',
  host: { style: 'display: contents' }
})
export class DashboardHeaderComponent {
  @Input() userEmail: string = '';
  @Input() date: Date = new Date();
}