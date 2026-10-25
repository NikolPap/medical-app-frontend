import { Component, input } from '@angular/core';
import { DatePipe, TitleCasePipe } from '@angular/common';
import { InitialPipe } from '../../../../core/pipes/appointment-status-pipe';

@Component({
  selector: 'app-dashboard-header',
  standalone: true,
  imports: [DatePipe, TitleCasePipe, InitialPipe],
  templateUrl: './dashboard-header.html',
  host: { style: 'display: contents' }
})
export class DashboardHeaderComponent {
  readonly userEmail = input('');
  readonly date = input<Date>(new Date());
}