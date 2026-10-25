import { Component, input, output } from '@angular/core';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [RouterModule],
  templateUrl: './app-sidebar.html',
  host: { style: 'display: contents' }
})
export class AppSidebarComponent {
  readonly userRole = input('');

  readonly openSchedule = output<void>();
  readonly openNewAppointment = output<void>();
  readonly logoutClicked = output<void>();
}