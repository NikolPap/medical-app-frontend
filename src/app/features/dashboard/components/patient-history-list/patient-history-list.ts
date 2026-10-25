import { Component, input, output } from '@angular/core';
import { DatePipe, NgClass, TitleCasePipe } from '@angular/common';
import { Appointment } from '../../../../core/models/appointment.model';
import { StatusLabelPipe, StatusDotClassPipe } from '../../../../core/pipes/appointment-status-pipe';

@Component({
  selector: 'app-patient-history-list',
  standalone: true,
  imports: [NgClass, DatePipe, TitleCasePipe, StatusLabelPipe, StatusDotClassPipe],
  templateUrl: './patient-history-list.html',
  host: { style: 'display: contents' }
})
export class PatientHistoryListComponent {
  readonly appointments = input<Appointment[]>([]);
  readonly historyView = input<'UPCOMING' | 'PAST'>('UPCOMING');
  readonly currentPage = input(1);
  readonly totalPages = input(1);

  readonly historyViewChange = output<'UPCOMING' | 'PAST'>();
  readonly prevPage = output<void>();
  readonly nextPage = output<void>();
  readonly rowClick = output<Appointment>();

  getDayNumber(dateStr: string): string {
    return new Date(dateStr).getDate().toString().padStart(2, '0');
  }

  getMonthShort(dateStr: string): string {
    return new Date(dateStr).toLocaleString('de-DE', { month: 'short' });
  }
}