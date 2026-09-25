import { Component, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AppointmentService } from '../../core/services/appointment';
import { Appointment } from '../../core/models/appointment.model';
import { Router } from '@angular/router';
import { MessageService } from 'primeng/api';

import { BookAppointmentComponent } from './components/book-appointment/book-appointment';
import { DoctorSettingsComponent } from './components/doctor-settings/doctor-settings';
import { AppSidebarComponent } from './components/app-sidebar/app-sidebar';
import { AppBottomNavComponent } from './components/app-bottom-nav/app-bottom-nav';
import { DashboardHeaderComponent } from './components/dashboard-header/dashboard-header';
import { SummaryCardsComponent, SummaryCounts } from './components/summary-cards/summary-cards';
import { TodayAppointmentsComponent } from './components/today-appointments/today-appointments';
import { DoctorAppointmentListComponent, AppointmentGroup } from './components/doctor-appointment-list/doctor-appointment-list';
import { PatientHistoryListComponent } from './components/patient-history-list/patient-history-list';
import { AppointmentDetailDialogComponent } from './components/appointment-detail-dialog/appointment-detail-dialog';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    BookAppointmentComponent, DoctorSettingsComponent,
    AppSidebarComponent, AppBottomNavComponent, DashboardHeaderComponent,
    SummaryCardsComponent, TodayAppointmentsComponent,
    DoctorAppointmentListComponent, PatientHistoryListComponent,
    AppointmentDetailDialogComponent
  ],
  templateUrl: './dashboard.html'
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

  currentPage: number = 1;
  itemsPerPage: number = 5;

  currentFilter: string = 'ALL';
  doctorView: 'CURRENT' | 'PAST' | 'CANCELLED' = 'CURRENT';
  historyView: 'UPCOMING' | 'PAST' = 'UPCOMING';

  groupedDoctorAppointments: AppointmentGroup[] = [];

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
        if (this.userRole === 'ROLE_DOCTOR') this.updateDoctorView();
        else this.updatePatientView();
        this.isLoading = false;
      },
      error: (err: any) => { console.error('Fehler beim Laden:', err); this.isLoading = false; }
    });
  }

  // ==== ARZT ====
  get todaysAppointments(): Appointment[] {
    const today = new Date();
    return this.appointments.filter(a => {
      const d = new Date(a.appointmentDate);
      return d.getDate() === today.getDate() && d.getMonth() === today.getMonth() && d.getFullYear() === today.getFullYear()
        && a.status === 'CONFIRMED' && a.patientEmail !== a.doctorEmail;
    });
  }

  get pendingAppointmentsCount(): number {
    return this.appointments.filter(a => a.status === 'PENDING').length;
  }

  setDoctorView(view: 'CURRENT' | 'PAST' | 'CANCELLED') {
    this.doctorView = view;
    this.currentFilter = 'ALL';
    this.updateDoctorView();
  }

  showPendingOnly() { this.currentFilter = 'PENDING'; this.updateDoctorView(); }
  resetDoctorFilter() { this.currentFilter = 'ALL'; this.updateDoctorView(); }

  updateDoctorView() {
    const now = new Date();
    let valid = this.appointments.filter(a => !(a.patientEmail === a.doctorEmail && a.status === 'CANCELLED'));

    if (this.currentFilter === 'PENDING') {
      valid = valid.filter(a => a.status === 'PENDING');
    } else if (this.doctorView === 'CURRENT') {
      valid = valid.filter(a => new Date(a.appointmentDate) >= now && a.status !== 'CANCELLED');
    } else if (this.doctorView === 'PAST') {
      valid = valid.filter(a => new Date(a.appointmentDate) < now && a.status !== 'CANCELLED');
    } else if (this.doctorView === 'CANCELLED') {
      valid = valid.filter(a => a.status === 'CANCELLED');
    }

    valid.sort((a, b) => new Date(a.appointmentDate).getTime() - new Date(b.appointmentDate).getTime());
    this.filteredAppointments = valid;

    const groups = new Map<string, Appointment[]>();
    valid.forEach(a => {
      const label = new Date(a.appointmentDate).toLocaleDateString('de-DE', { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' });
      if (!groups.has(label)) groups.set(label, []);
      groups.get(label)!.push(a);
    });
    this.groupedDoctorAppointments = Array.from(groups.entries()).map(([label, items]) => ({ label, items }));
  }

  // ==== ASTHENIS ====
  applyFilter(filterType: string) { this.currentFilter = filterType; this.currentPage = 1; this.updatePatientView(); }
  setHistoryView(view: 'UPCOMING' | 'PAST') { this.historyView = view; this.currentPage = 1; this.updatePatientView(); }

  updatePatientView() {
    const now = new Date();
    let valid = this.appointments.filter(a => !(a.patientEmail === a.doctorEmail && a.status === 'CANCELLED'));

    if (this.historyView === 'UPCOMING') {
      valid = valid.filter(a => new Date(a.appointmentDate) >= now);
      valid.sort((a, b) => new Date(a.appointmentDate).getTime() - new Date(b.appointmentDate).getTime());
    } else {
      valid = valid.filter(a => new Date(a.appointmentDate) < now);
      valid.sort((a, b) => new Date(b.appointmentDate).getTime() - new Date(a.appointmentDate).getTime());
    }

    if (this.currentFilter !== 'ALL') valid = valid.filter(a => a.status === this.currentFilter);
    this.filteredAppointments = valid;
  }

  get summaryCounts(): SummaryCounts {
    const now = new Date();
    const valid = this.appointments.filter(a => !(a.patientEmail === a.doctorEmail && a.status === 'CANCELLED'));
    return {
      pending: valid.filter(a => a.status === 'PENDING' && new Date(a.appointmentDate) >= now).length,
      confirmed: valid.filter(a => a.status === 'CONFIRMED' && new Date(a.appointmentDate) >= now).length,
      cancelled: valid.filter(a => a.status === 'CANCELLED' && new Date(a.appointmentDate) >= now).length,
      all: valid.filter(a => new Date(a.appointmentDate) >= now).length
    };
  }

  get paginatedAppointments(): Appointment[] {
    const start = (this.currentPage - 1) * this.itemsPerPage;
    return this.filteredAppointments.slice(start, start + this.itemsPerPage);
  }
  get totalPages(): number { return Math.ceil(this.filteredAppointments.length / this.itemsPerPage); }
  nextPage() { if (this.currentPage < this.totalPages) this.currentPage++; }
  prevPage() { if (this.currentPage > 1) this.currentPage--; }

  // ==== DIALOG ====
  openStatusDialog(appointment: Appointment) {
    this.selectedAppointment = appointment;
    this.showCancelConfirm = false;
    this.showStatusDialog = true;
  }

  requestCancel() { this.showCancelConfirm = true; }
  cancelCancelRequest() { this.showCancelConfirm = false; }

  confirmCancelFinal() {
    this.isSubmitting = true;
    this.changeStatus('CANCELLED');
  }

  changeStatus(newStatus: string) {
    if (!this.selectedAppointment) return;
    this.isSubmitting = true;
    this.appointmentService.updateAppointmentStatus(this.selectedAppointment.id, newStatus).subscribe({
      next: () => {
        this.messageService.add({ severity: 'success', summary: 'Erfolg', detail: 'Status aktualisiert!' });
        this.showStatusDialog = false;
        this.showCancelConfirm = false;
        this.isSubmitting = false;
        this.loadAppointments();
      },
      error: (err: any) => {
        this.isSubmitting = false;
        this.messageService.add({ severity: 'error', summary: 'Fehler', detail: err.error?.error || 'Aktion nicht möglich.' });
      }
    });
  }

  quickConfirm(appt: Appointment) { this.selectedAppointment = appt; this.changeStatus('CONFIRMED'); }
  quickCancel(appt: Appointment) { this.selectedAppointment = appt; this.changeStatus('CANCELLED'); }

  openRescheduleDialog(appt: Appointment) {
  this.showStatusDialog = false;
  this.bookAppointmentModal.patientEmailToReschedule = appt.patientEmail;
  this.bookAppointmentModal.oldAppointmentIdToCancel = appt.id;
  this.bookAppointmentModal.userRole = this.userRole;

  this.bookAppointmentModal.openDialog(); // 1. reset() γίνεται εδώ

  if (appt.doctorId) {
    this.bookAppointmentModal.newAppointmentForm.patchValue({ doctorId: appt.doctorId }); // 2. μετά το patch
  }
}

  logout() { localStorage.removeItem('jwt_token'); window.location.href = '/login'; }

  openNewAppointmentDialog() {
    this.bookAppointmentModal.oldAppointmentIdToCancel = null;
    this.bookAppointmentModal.patientEmailToReschedule = null;
    this.bookAppointmentModal.userRole = this.userRole;
    this.bookAppointmentModal.openDialog();
  }

  openScheduleDialog() { this.doctorSettingsModal.openDialog(); }
}