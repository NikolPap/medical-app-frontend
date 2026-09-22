import { Component, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AppointmentService } from '../../core/services/appointment';
import { Appointment } from '../../core/models/appointment.model';
import { Router } from '@angular/router'; 
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators, FormsModule } from '@angular/forms';

// PRIMENG IMPORTS
import { TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag'; 
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { DialogModule } from 'primeng/dialog';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';
import { DropdownModule } from 'primeng/dropdown';
import { CalendarModule } from 'primeng/calendar';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { ConfirmationService } from 'primeng/api'; 
import { AvatarModule } from 'primeng/avatar';

import { BookAppointmentComponent } from './components/book-appointment/book-appointment';
import { DoctorSettingsComponent } from './components/doctor-settings/doctor-settings';
@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [
    CommonModule, ReactiveFormsModule, FormsModule, TableModule, TagModule, ButtonModule, CardModule, 
    DialogModule, ToastModule, DropdownModule, CalendarModule, ConfirmDialogModule, AvatarModule,
    BookAppointmentComponent, DoctorSettingsComponent
  ], 
  providers: [ConfirmationService],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.scss'
})
export class DashboardComponent implements OnInit {

  @ViewChild('bookAppointmentModal') bookAppointmentModal!: BookAppointmentComponent;
  @ViewChild('doctorSettingsModal') doctorSettingsModal!: DoctorSettingsComponent;

  appointments: Appointment[] = [];
  filteredAppointments: Appointment[] = []; 
  isLoading: boolean = true;
  
  userRole: string = ''; 
  userEmail: string = ''; 
  minDate: Date = new Date();
  
  // PAGINATION (PATIENT)
  currentPage: number = 1;
  itemsPerPage: number = 5;

  // NEU: STATUS- & VIEW-CONTROLS AUS DEINEM HTML!
  currentFilter: string = 'ALL'; 
  doctorView: 'CURRENT' | 'PAST' | 'CANCELLED' = 'CURRENT'; // Für die 3 Tabs des Arztes
  historyView: 'UPCOMING' | 'PAST' = 'UPCOMING'; // Für die 2 Tabs des Patienten
  
  groupedDoctorAppointments: { label: string, items: Appointment[] }[] = []; // Gruppierte Liste für den Arzt

  showStatusDialog: boolean = false;
  selectedAppointment: Appointment | null = null;
  showCancelConfirm: boolean = false;
  isSubmitting: boolean = false;

  constructor(
    private appointmentService: AppointmentService,
    private messageService: MessageService,
    private router: Router
  ) {}

  ngOnInit(): void {
    const token = localStorage.getItem('jwt_token');
    if (token) {
      const payload = JSON.parse(atob(token.split('.')[1]));
      this.userRole = payload.role;
      this.userEmail = payload.sub;
    }
    this.loadAppointments();
  }

  loadAppointments() {
    this.isLoading = true;
    this.appointmentService.getMyAppointments().subscribe({
      next: (data: Appointment[]) => {
        this.appointments = data;
        
        // UI aktualisieren je nach Rolle
        if (this.userRole === 'ROLE_DOCTOR') {
          this.updateDoctorView();
        } else {
          this.updatePatientView();
        }
        
        this.isLoading = false;
      },
      error: (err: any) => {
        console.error("Fehler beim Laden:", err);
        this.isLoading = false;
      }
    });
  }

  // ==========================================
  // ARZT LOGIK (DOCTOR VIEW)
  // ==========================================

  get todaysAppointments(): Appointment[] {
    const today = new Date();
    return this.appointments.filter(a => {
      const apptDate = new Date(a.appointmentDate);
      return apptDate.getDate() === today.getDate() &&
             apptDate.getMonth() === today.getMonth() &&
             apptDate.getFullYear() === today.getFullYear() &&
             a.status === 'CONFIRMED' && 
             a.patientEmail !== a.doctorEmail;
    });
  }

  get pendingAppointmentsCount(): number {
    return this.appointments.filter(a => a.status === 'PENDING').length;
  }

  setDoctorView(view: 'CURRENT' | 'PAST' | 'CANCELLED') {
    this.doctorView = view;
    this.currentFilter = 'ALL'; // Reset Filter
    this.updateDoctorView();
  }

  showPendingOnly() {
    this.currentFilter = 'PENDING';
    this.updateDoctorView();
  }

  resetDoctorFilter() {
    this.currentFilter = 'ALL';
    this.updateDoctorView();
  }

  updateDoctorView() {
    const now = new Date();
    let valid = this.appointments.filter(a => !(a.patientEmail === a.doctorEmail && a.status === 'CANCELLED'));

    // 1. Wenn PENDING aktiv ist, nur PENDING zeigen!
    if (this.currentFilter === 'PENDING') {
      valid = valid.filter(a => a.status === 'PENDING');
    } else {
      // 2. Ansonsten nach Tabs filtern (CURRENT, PAST, CANCELLED)
      if (this.doctorView === 'CURRENT') {
        valid = valid.filter(a => new Date(a.appointmentDate) >= now && a.status !== 'CANCELLED');
      } else if (this.doctorView === 'PAST') {
        valid = valid.filter(a => new Date(a.appointmentDate) < now && a.status !== 'CANCELLED');
      } else if (this.doctorView === 'CANCELLED') {
        valid = valid.filter(a => a.status === 'CANCELLED');
      }
    }

    // Chronologisch sortieren
    valid.sort((a, b) => new Date(a.appointmentDate).getTime() - new Date(b.appointmentDate).getTime());
    this.filteredAppointments = valid;

    // Gruppieren nach Datum (z.B. "Montag, 15. Dezember 2026")
    const groups = new Map<string, Appointment[]>();
    valid.forEach(a => {
      const dateStr = new Date(a.appointmentDate).toLocaleDateString('de-DE', { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' });
      if (!groups.has(dateStr)) groups.set(dateStr, []);
      groups.get(dateStr)!.push(a);
    });

    this.groupedDoctorAppointments = Array.from(groups.entries()).map(([label, items]) => ({ label, items }));
  }


  // ==========================================
  // PATIENT LOGIK (PATIENT VIEW)
  // ==========================================

  applyFilter(filterType: string) {
    this.currentFilter = filterType;
    this.currentPage = 1; 
    this.updatePatientView();
  }

  setHistoryView(view: 'UPCOMING' | 'PAST') {
    this.historyView = view;
    this.currentPage = 1;
    this.updatePatientView();
  }

  updatePatientView() {
    const now = new Date();
    let valid = this.appointments.filter(a => !(a.patientEmail === a.doctorEmail && a.status === 'CANCELLED'));

    // 1. Nach Historien-Tab filtern
    if (this.historyView === 'UPCOMING') {
      valid = valid.filter(a => new Date(a.appointmentDate) >= now);
      valid.sort((a, b) => new Date(a.appointmentDate).getTime() - new Date(b.appointmentDate).getTime());
    } else {
      valid = valid.filter(a => new Date(a.appointmentDate) < now);
      valid.sort((a, b) => new Date(b.appointmentDate).getTime() - new Date(a.appointmentDate).getTime());
    }

    // 2. Nach Summary-Card filtern (wenn nicht ALL)
    if (this.currentFilter !== 'ALL') {
      valid = valid.filter(a => a.status === this.currentFilter);
    }

    this.filteredAppointments = valid;
  }

  getCount(filterType: string): number {
    const now = new Date();
    const valid = this.appointments.filter(a => !(a.patientEmail === a.doctorEmail && a.status === 'CANCELLED'));

    if (filterType === 'ALL') return valid.filter(a => new Date(a.appointmentDate) >= now).length;
    if (filterType === 'PAST') return valid.filter(a => new Date(a.appointmentDate) < now).length;
    return valid.filter(a => a.status === filterType && new Date(a.appointmentDate) >= now).length;
  }

  // Paginierung Patient
  get paginatedAppointments(): Appointment[] {
    const startIndex = (this.currentPage - 1) * this.itemsPerPage;
    return this.filteredAppointments.slice(startIndex, startIndex + this.itemsPerPage);
  }

  get totalPages(): number {
    return Math.ceil(this.filteredAppointments.length / this.itemsPerPage);
  }

  nextPage() { if (this.currentPage < this.totalPages) this.currentPage++; }
  prevPage() { if (this.currentPage > 1) this.currentPage--; }


  // ==========================================
  // GEMEINSAME HELPER & UI METHODEN
  // ==========================================

  getInitial(email: string): string {
    return email ? email.charAt(0).toUpperCase() : '?';
  }

  getDayNumber(dateStr: string): string {
    return new Date(dateStr).getDate().toString().padStart(2, '0');
  }

  getMonthShort(dateStr: string): string {
    return new Date(dateStr).toLocaleString('de-DE', { month: 'short' });
  }

  getStatusLabel(status: string): string {
    if (status === 'CONFIRMED') return 'Bestätigt';
    if (status === 'PENDING') return 'Ausstehend';
    return 'Storniert';
  }

  getStatusTextClass(appt: Appointment): string {
    if (appt.patientEmail === appt.doctorEmail) return 'text-status-brick';
    if (appt.status === 'CONFIRMED') return 'text-status-sage';
    if (appt.status === 'PENDING') return 'text-status-ochre';
    return 'text-status-brick';
  }

  getStatusDotClass(appt: Appointment): string {
    if (appt.patientEmail === appt.doctorEmail) return 'bg-status-brick';
    if (appt.status === 'CONFIRMED') return 'bg-status-sage';
    if (appt.status === 'PENDING') return 'bg-status-ochre';
    return 'bg-status-brick';
  }

  isLockedAppt(appt: Appointment): boolean {
    return appt.status === 'CANCELLED' || appt.patientEmail === appt.doctorEmail;
  }

 openStatusDialog(appointment: Appointment) {
  this.selectedAppointment = appointment;
  this.showCancelConfirm = false; // reset κάθε φορά που ανοίγει
  this.showStatusDialog = true;
}

requestCancel() { this.showCancelConfirm = true; }
cancelCancelRequest() { this.showCancelConfirm = false; }

confirmCancelFinal(withBilling: boolean) {
  this.isSubmitting = true;
  // TODO: sobald Backend ein "billable"-Flag kennt, hier mitschicken
  if (withBilling) {
    this.messageService.add({ severity: 'info', summary: 'Hinweis', detail: 'Termin wird als abzurechnen markiert.' });
  }
  this.changeStatus('CANCELLED');
}

changeStatus(newStatus: string) {
  if (!this.selectedAppointment) return;
  this.isSubmitting = true;
  this.appointmentService.updateAppointmentStatus(this.selectedAppointment.id, newStatus).subscribe({
    next: () => {
      this.messageService.add({severity: 'success', summary: 'Erfolg', detail: 'Status aktualisiert!'});
      this.showStatusDialog = false;
      this.showCancelConfirm = false;
      this.isSubmitting = false;
      this.loadAppointments();
    },
    error: (err: any) => {
      this.isSubmitting = false;
      this.messageService.add({severity: 'error', summary: 'Fehler', detail: err.error?.error || 'Aktion nicht möglich.'});
    }
  });
}

openRescheduleDialog(appt: Appointment) {
    this.showStatusDialog = false; 

    // Wir übergeben ALLES, was das Modal für ein echtes Verschieben braucht!
    this.bookAppointmentModal.patientEmailToReschedule = appt.patientEmail;
    this.bookAppointmentModal.oldAppointmentIdToCancel = appt.id; // NEU: Dieses ID wird storniert!
    this.bookAppointmentModal.userRole = this.userRole; // NEU: Wer verschiebt gerade?

    // Wir wählen den Arzt schon mal im Dropdown aus
    if (appt.doctorId) {
      this.bookAppointmentModal.newAppointmentForm.patchValue({ doctorId: appt.doctorId });
    }

    this.bookAppointmentModal.openDialog();
  }

getTimelineSteps(appt: Appointment): { label: string, state: 'done' | 'current' | 'future' }[] {
  const isPast = new Date(appt.appointmentDate) < new Date();
  return [
    { label: 'Angefragt', state: 'done' },
    { label: 'Bestätigt', state: appt.status === 'CONFIRMED' ? 'done' : 'current' },
    { label: isPast ? 'Abgeschlossen' : 'Termin', state: (isPast && appt.status === 'CONFIRMED') ? 'done' : 'future' }
  ];
}

encodeURIComponent(str: string): string {
  return window.encodeURIComponent(str);
}


  // Quick-Actions aus dem HTML
  quickConfirm(appt: Appointment) {
    this.selectedAppointment = appt;
    this.changeStatus('CONFIRMED');
  }

  quickCancel(appt: Appointment) {
    this.selectedAppointment = appt;
    this.changeStatus('CANCELLED');
  }


  logout() {
    localStorage.removeItem('jwt_token');
    window.location.href = '/login'; 
  }

 openNewAppointmentDialog() {
    // Wenn es ein komplett NEUER Termin ist, stellen wir sicher, dass kein alter storniert wird!
    this.bookAppointmentModal.oldAppointmentIdToCancel = null;
    this.bookAppointmentModal.patientEmailToReschedule = null;
    this.bookAppointmentModal.userRole = this.userRole;
    
    this.bookAppointmentModal.openDialog(); 
  }

  openScheduleDialog() {
    this.doctorSettingsModal.openDialog(); 
  }

  getStatusClasses(status: string): string {
  switch (status) {
    case 'CONFIRMED':
      return 'bg-status-sage/15 text-status-sage';
    case 'PENDING':
      return 'bg-status-ochre/15 text-status-ochre';
    case 'CANCELLED':
      return 'bg-status-brick/15 text-status-brick';
    default:
      return 'bg-gray-100 text-gray-500';
  }
}

}