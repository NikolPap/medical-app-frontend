import { Component, input, output } from '@angular/core';
import { Appointment } from '../../../../core/models/appointment.model';
import { AppointmentRowComponent } from '../appointment-row/appointment-row';

@Component({
  selector: 'app-today-appointments',
  standalone: true,
  imports: [AppointmentRowComponent],
  templateUrl: './today-appointments.html',
  host: { style: 'display: contents' }
})
export class TodayAppointmentsComponent {
  readonly appointments = input<Appointment[]>([]);

  readonly appointmentClick = output<Appointment>();
}