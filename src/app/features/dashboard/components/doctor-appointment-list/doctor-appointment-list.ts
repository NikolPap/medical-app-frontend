import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ButtonModule } from 'primeng/button';
import { AvatarModule } from 'primeng/avatar';
import { Appointment } from '../../../../core/models/appointment.model';
import { AppointmentRowComponent } from '../appointment-row/appointment-row';
import { InitialPipe } from '../../../../core/pipes/appointment-status-pipe';

export interface AppointmentGroup { label: string; items: Appointment[]; }

@Component({
   selector: 'app-doctor-appointment-list',
  standalone: true,
  imports: [CommonModule, ButtonModule, AvatarModule, AppointmentRowComponent, InitialPipe],
  templateUrl: './doctor-appointment-list.html',
  host: { style: 'display: contents' }
})
export class DoctorAppointmentListComponent {
  @Input() groups: AppointmentGroup[] = [];
  @Input() doctorView: 'CURRENT' | 'PAST' | 'CANCELLED' = 'CURRENT';
  @Input() currentFilter: string = 'ALL';
  @Input() pendingCount: number = 0;
  @Input() userEmail: string = '';

  @Output() viewChange = new EventEmitter<'CURRENT' | 'PAST' | 'CANCELLED'>();
  @Output() showPendingOnly = new EventEmitter<void>();
  @Output() resetFilter = new EventEmitter<void>();
  @Output() rowClick = new EventEmitter<Appointment>();
  @Output() confirm = new EventEmitter<Appointment>();
  @Output() cancel = new EventEmitter<Appointment>();
}