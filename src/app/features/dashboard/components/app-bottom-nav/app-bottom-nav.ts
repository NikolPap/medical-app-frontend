import { Component, input, output, signal } from '@angular/core';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-bottom-nav',
  standalone: true,
  imports: [RouterModule],
  templateUrl: './app-bottom-nav.html',
  host: { style: 'display: contents' }
})
export class AppBottomNavComponent {
  readonly userRole = input('');

  readonly openSchedule = output<void>();
  readonly openNewAppointment = output<void>();
  readonly logoutClicked = output<void>();

  readonly showMoreMenu = signal(false);

  toggleMoreMenu(): void {
    this.showMoreMenu.update(open => !open);
  }
}