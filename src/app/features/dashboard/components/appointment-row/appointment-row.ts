import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AvatarModule } from 'primeng/avatar';
import { Appointment } from '../../../../core/models/appointment.model';
import { StatusLabelPipe, StatusDotClassPipe,StatusTextClassPipe, IsBlockedDayPipe, InitialPipe, isBlockedDay} from '../../../../core/pipes/appointment-status-pipe';

@Component({
  selector: 'app-appointment-row',
  standalone: true,
  imports: [CommonModule, AvatarModule, StatusLabelPipe, StatusDotClassPipe, StatusTextClassPipe, IsBlockedDayPipe, InitialPipe],
  templateUrl: './appointment-row.html'
})
export class AppointmentRowComponent {
  @Input({ required: true }) appt!: Appointment;
  @Input() mode: 'compact' | 'full' = 'full';

  @Output() rowClick = new EventEmitter<Appointment>();
  @Output() confirm = new EventEmitter<Appointment>();
  @Output() cancel = new EventEmitter<Appointment>();

  // ΝΕΟ: getter αντί για pipe μέσα στο (click)
  get isBlocked(): boolean {
    return isBlockedDay(this.appt);
  }

  onRowClick() {
    if (this.isBlocked) return;
    this.rowClick.emit(this.appt);
  }

  onConfirm(event: Event) {
    event.stopPropagation();
    this.confirm.emit(this.appt);
  }

  onCancel(event: Event) {
    event.stopPropagation();
    this.cancel.emit(this.appt);
  }
}