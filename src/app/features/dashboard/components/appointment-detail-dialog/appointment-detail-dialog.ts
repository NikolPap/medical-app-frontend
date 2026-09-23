import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DialogModule } from 'primeng/dialog';
import { ButtonModule } from 'primeng/button';
import { AvatarModule } from 'primeng/avatar';
import { Appointment } from '../../../../core/models/appointment.model';
import { StatusLabelPipe, StatusDotClassPipe, StatusBadgeClassPipe, InitialPipe } from '../../../../core/pipes/appointment-status-pipe';

@Component({
  selector: 'app-appointment-detail-dialog',
  standalone: true,
  imports: [CommonModule, DialogModule, ButtonModule, AvatarModule, StatusLabelPipe, StatusDotClassPipe, StatusBadgeClassPipe, InitialPipe],
  templateUrl: './appointment-detail-dialog.html'
})
export class AppointmentDetailDialogComponent {
  @Input() visible: boolean = false;
  @Input() appointment: Appointment | null = null;
  @Input() userRole: string = '';
  @Input() showCancelConfirm: boolean = false;
  @Input() isSubmitting: boolean = false;

  @Output() visibleChange = new EventEmitter<boolean>();
  @Output() confirmStatus = new EventEmitter<void>();
  @Output() requestCancel = new EventEmitter<void>();
  @Output() cancelCancelRequest = new EventEmitter<void>();
  @Output() confirmCancelFinal = new EventEmitter<void>();
  @Output() reschedule = new EventEmitter<Appointment>();

  onHide() {
    this.visibleChange.emit(false);
  }

  getTimelineSteps(appt: Appointment): { label: string, state: 'done' | 'current' | 'future' }[] {
    const isPast = new Date(appt.appointmentDate) < new Date();
    return [
      { label: 'Angefragt', state: 'done' },
      { label: 'Bestätigt', state: appt.status === 'CONFIRMED' ? 'done' : 'current' },
      { label: isPast ? 'Abgeschlossen' : 'Termin', state: (isPast && appt.status === 'CONFIRMED') ? 'done' : 'future' }
    ];
  }
}