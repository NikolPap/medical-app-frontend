import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
   selector: 'app-bottom-nav',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './app-bottom-nav.html',
  host: { style: 'display: contents' }
})
export class AppBottomNavComponent {
  @Input() userRole: string = '';
  @Output() openSchedule = new EventEmitter<void>();
  @Output() openNewAppointment = new EventEmitter<void>();
  @Output() logoutClicked = new EventEmitter<void>();
}