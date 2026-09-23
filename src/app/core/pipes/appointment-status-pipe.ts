import { Pipe, PipeTransform } from '@angular/core';
import { Appointment } from '../models/appointment.model';

export function isBlockedDay(appt: Appointment): boolean {
  return appt.patientEmail === appt.doctorEmail;
}

export function getStatusLabel(appt: Appointment): string {
  if (isBlockedDay(appt)) return 'Blockiert';
  if (appt.status === 'CONFIRMED') return 'Bestätigt';
  if (appt.status === 'PENDING') return 'Ausstehend';
  return 'Storniert';
}

export function getStatusDotClass(appt: Appointment): string {
  if (isBlockedDay(appt)) return 'bg-status-brick';
  if (appt.status === 'CONFIRMED') return 'bg-status-sage';
  if (appt.status === 'PENDING') return 'bg-status-ochre';
  return 'bg-status-brick';
}

export function getStatusTextClass(appt: Appointment): string {
  if (isBlockedDay(appt)) return 'text-status-brick';
  if (appt.status === 'CONFIRMED') return 'text-status-sage';
  if (appt.status === 'PENDING') return 'text-status-ochre';
  return 'text-status-brick';
}

export function getStatusBadgeClass(status: string): string {
  switch (status) {
    case 'CONFIRMED': return 'bg-status-sage/15 text-status-sage';
    case 'PENDING': return 'bg-status-ochre/15 text-status-ochre';
    case 'CANCELLED': return 'bg-status-brick/15 text-status-brick';
    default: return 'bg-gray-100 text-gray-500';
  }
}

@Pipe({ name: 'statusLabel', standalone: true })
export class StatusLabelPipe implements PipeTransform {
  transform(appt: Appointment): string { return getStatusLabel(appt); }
}

@Pipe({ name: 'statusDotClass', standalone: true })
export class StatusDotClassPipe implements PipeTransform {
  transform(appt: Appointment): string { return getStatusDotClass(appt); }
}

@Pipe({ name: 'statusTextClass', standalone: true })
export class StatusTextClassPipe implements PipeTransform {
  transform(appt: Appointment): string { return getStatusTextClass(appt); }
}

@Pipe({ name: 'statusBadgeClass', standalone: true })
export class StatusBadgeClassPipe implements PipeTransform {
  transform(status: string): string { return getStatusBadgeClass(status); }
}

@Pipe({ name: 'isBlockedDay', standalone: true })
export class IsBlockedDayPipe implements PipeTransform {
  transform(appt: Appointment): boolean { return isBlockedDay(appt); }
}

@Pipe({ name: 'initial', standalone: true })
export class InitialPipe implements PipeTransform {
  transform(text: string): string { return text ? text.charAt(0).toUpperCase() : '?'; }
}