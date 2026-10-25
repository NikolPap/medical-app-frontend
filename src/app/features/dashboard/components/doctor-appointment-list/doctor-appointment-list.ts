import { Component, input, output } from '@angular/core';
import { NgClass, TitleCasePipe } from '@angular/common';
import { ButtonModule } from 'primeng/button';
import { AvatarModule } from 'primeng/avatar';
import { Appointment } from '../../../../core/models/appointment.model';
import { AppointmentRowComponent } from '../appointment-row/appointment-row';
import { InitialPipe } from '../../../../core/pipes/appointment-status-pipe';

export interface AppointmentGroup { label: string; items: Appointment[]; }

@Component({
  selector: 'app-doctor-appointment-list',
  standalone: true,
  imports: [NgClass, TitleCasePipe, ButtonModule, AvatarModule, AppointmentRowComponent, InitialPipe],
  templateUrl: './doctor-appointment-list.html',
  host: { style: 'display: contents' }
})
export class DoctorAppointmentListComponent {
  readonly groups = input<AppointmentGroup[]>([]);
  readonly doctorView = input<'CURRENT' | 'PAST' | 'CANCELLED'>('CURRENT');
  readonly currentFilter = input('ALL');
  readonly pendingCount = input(0);
  readonly userEmail = input('');

  readonly viewChange = output<'CURRENT' | 'PAST' | 'CANCELLED'>();
  readonly showPendingOnly = output<void>();
  readonly resetFilter = output<void>();
  readonly rowClick = output<Appointment>();
  readonly confirm = output<Appointment>();
  readonly cancel = output<Appointment>();
}