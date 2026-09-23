import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Appointment } from '../../../../core/models/appointment.model';
import { StatusLabelPipe, StatusDotClassPipe } from '../../../../core/pipes/appointment-status-pipe';

@Component({
   selector: 'app-patient-history-list',
  standalone: true,
  imports: [CommonModule, StatusLabelPipe, StatusDotClassPipe],
  templateUrl: './patient-history-list.html',
  host: { style: 'display: contents' }
})
export class PatientHistoryListComponent {
  @Input() appointments: Appointment[] = [];
  @Input() historyView: 'UPCOMING' | 'PAST' = 'UPCOMING';
  @Input() currentPage: number = 1;
  @Input() totalPages: number = 1;

  @Output() historyViewChange = new EventEmitter<'UPCOMING' | 'PAST'>();
  @Output() prevPage = new EventEmitter<void>();
  @Output() nextPage = new EventEmitter<void>();
  @Output() rowClick = new EventEmitter<Appointment>();

  getDayNumber(dateStr: string): string {
    return new Date(dateStr).getDate().toString().padStart(2, '0');
  }
  getMonthShort(dateStr: string): string {
    return new Date(dateStr).toLocaleString('de-DE', { month: 'short' });
  }
}