import { Component, computed, input, model, output } from '@angular/core';
import { DatePipe, NgClass } from '@angular/common';
import { DialogModule } from 'primeng/dialog';
import { ButtonModule } from 'primeng/button';
import { AvatarModule } from 'primeng/avatar';
import { Appointment } from '../../../../core/models/appointment.model';
import {
  StatusLabelPipe, StatusDotClassPipe, StatusBadgeClassPipe, InitialPipe
} from '../../../../core/pipes/appointment-status-pipe';

interface TimelineStep {
  label: string;
  state: 'done' | 'current' | 'future';
}

@Component({
  selector: 'app-appointment-detail-dialog',
  standalone: true,
  imports: [
    NgClass, DatePipe, DialogModule, ButtonModule, AvatarModule,
    StatusLabelPipe, StatusDotClassPipe, StatusBadgeClassPipe, InitialPipe
  ],
  templateUrl: './appointment-detail-dialog.html'
})
export class AppointmentDetailDialogComponent {
  readonly visible = model(false);
  readonly appointment = input<Appointment | null>(null);
  readonly userRole = input('');
  readonly showCancelConfirm = input(false);
  readonly isSubmitting = input(false);

  readonly confirmStatus = output<void>();
  readonly requestCancel = output<void>();
  readonly cancelCancelRequest = output<void>();
  readonly confirmCancelFinal = output<void>();
  readonly reschedule = output<Appointment>();

  readonly isPastAppointment = computed(() => {
    const appt = this.appointment();
    return !!appt && new Date(appt.appointmentDate) < new Date();
  });

  /** Darf der Patient noch stornieren/verschieben? (48-Stunden-Regel) */
  readonly canCancelOrReschedule = computed(() => {
    const appt = this.appointment();
    if (!appt || this.userRole() === 'ROLE_DOCTOR') {
      return true; // Der Arzt darf immer
    }

    const hoursUntil = (new Date(appt.appointmentDate).getTime() - Date.now()) / (1000 * 60 * 60);
    return hoursUntil >= 48;
  });

  readonly timelineSteps = computed<TimelineStep[]>(() => {
    const appt = this.appointment();
    if (!appt) return [];

    const isPast = new Date(appt.appointmentDate) < new Date();
    return [
      { label: 'Angefragt', state: 'done' },
      { label: 'Bestätigt', state: appt.status === 'CONFIRMED' ? 'done' : 'current' },
      { label: isPast ? 'Abgeschlossen' : 'Termin', state: (isPast && appt.status === 'CONFIRMED') ? 'done' : 'future' }
    ];
  });
}