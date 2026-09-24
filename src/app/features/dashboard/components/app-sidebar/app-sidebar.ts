import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './app-sidebar.html',
  host: { style: 'display: contents' }
})
export class AppSidebarComponent {
  @Input() userRole: string = '';
  @Output() openSchedule = new EventEmitter<void>();
  @Output() openNewAppointment = new EventEmitter<void>();
  @Output() logoutClicked = new EventEmitter<void>();
}