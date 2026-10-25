import { Component, computed, input, output } from '@angular/core';
import { DatePipe, NgClass } from '@angular/common';
import { AvatarModule } from 'primeng/avatar';
import { Appointment } from '../../../../core/models/appointment.model';
import {
  StatusLabelPipe, StatusDotClassPipe, StatusTextClassPipe, InitialPipe, isBlockedDay
} from '../../../../core/pipes/appointment-status-pipe';

@Component({
  selector: 'app-appointment-row',
  standalone: true,
  imports: [NgClass, DatePipe, AvatarModule, StatusLabelPipe, StatusDotClassPipe, StatusTextClassPipe, InitialPipe],
  templateUrl: './appointment-row.html'
})
export class AppointmentRowComponent {
  readonly appt = input.required<Appointment>();
  readonly mode = input<'compact' | 'full'>('full');

  readonly rowClick = output<Appointment>();
  readonly confirm = output<Appointment>();
  readonly cancel = output<Appointment>();

  readonly isBlocked = computed(() => isBlockedDay(this.appt()));

  onRowClick(): void {
    if (this.isBlocked()) return;
    this.rowClick.emit(this.appt());
  }

  onConfirm(event: Event): void {
    event.stopPropagation();
    this.confirm.emit(this.appt());
  }

  onCancel(event: Event): void {
    event.stopPropagation();
    this.cancel.emit(this.appt());
  }
}