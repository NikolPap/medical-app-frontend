import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Appointment } from '../../../../core/models/appointment.model';
import { AppointmentRowComponent } from '../appointment-row/appointment-row';

@Component({
   selector: 'app-today-appointments',
  standalone: true,
  imports: [CommonModule, AppointmentRowComponent],
  templateUrl: './today-appointments.html',
  host: { style: 'display: contents' }
})
export class TodayAppointmentsComponent {
  @Input() appointments: Appointment[] = [];
  @Output() appointmentClick = new EventEmitter<Appointment>();
}