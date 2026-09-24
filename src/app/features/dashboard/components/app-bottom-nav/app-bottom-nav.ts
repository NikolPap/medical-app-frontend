import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-bottom-nav',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './app-bottom-nav.html',
  host: { style: 'display: contents' }
})
export class AppBottomNavComponent {
  @Input() userRole: string = '';
  @Output() openSchedule = new EventEmitter<void>();
  @Output() openNewAppointment = new EventEmitter<void>();
  @Output() logoutClicked = new EventEmitter<void>();

  showMoreMenu: boolean = false;

  toggleMoreMenu() {
    this.showMoreMenu = !this.showMoreMenu;
  }
}