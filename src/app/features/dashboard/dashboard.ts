import { Component, OnInit, computed, inject, signal, viewChild } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { MessageService } from 'primeng/api';

import { AppointmentService } from '../../core/services/appointment';
import { Appointment } from '../../core/models/appointment.model';

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

type DoctorView = 'CURRENT' | 'PAST' | 'CANCELLED';
type HistoryView = 'UPCOMING' | 'PAST';

const ITEMS_PER_PAGE = 5;

const byDateAsc = (a: Appointment, b: Appointment) =>
  new Date(a.appointmentDate).getTime() - new Date(b.appointmentDate).getTime();

const byDateDesc = (a: Appointment, b: Appointment) => byDateAsc(b, a);

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [
    BookAppointmentComponent, DoctorSettingsComponent,
    AppSidebarComponent, AppBottomNavComponent, DashboardHeaderComponent,
    SummaryCardsComponent, TodayAppointmentsComponent,
    DoctorAppointmentListComponent, PatientHistoryListComponent,
    AppointmentDetailDialogComponent
  ],
  templateUrl: './dashboard.html'
})
export class DashboardComponent implements OnInit {
  private readonly appointmentService = inject(AppointmentService);
  private readonly messageService = inject(MessageService);

  readonly bookAppointmentModal = viewChild.required<BookAppointmentComponent>('bookAppointmentModal');
  readonly doctorSettingsModal = viewChild.required<DoctorSettingsComponent>('doctorSettingsModal');

  // ==== STATE ====
  readonly appointments = signal<Appointment[]>([]);
  readonly isLoading = signal(true);

  readonly userRole = signal('');
  readonly userEmail = signal('');
  readonly minDate = new Date();

  readonly currentPage = signal(1);
  readonly currentFilter = signal('ALL');
  readonly doctorView = signal<DoctorView>('CURRENT');
  readonly historyView = signal<HistoryView>('UPCOMING');

  readonly showStatusDialog = signal(false);
  readonly selectedAppointment = signal<Appointment | null>(null);
  readonly showCancelConfirm = signal(false);
  readonly isSubmitting = signal(false);

  // ==== ABGELEITETE WERTE ====
  /** Urlaubstage, die storniert wurden, werden nirgends angezeigt */
  private readonly validAppointments = computed(() =>
    this.appointments().filter(a => !(a.patientEmail === a.doctorEmail && a.status === 'CANCELLED'))
  );

  readonly todaysAppointments = computed(() => {
    const today = new Date();
    return this.appointments().filter(a => {
      const d = new Date(a.appointmentDate);
      return d.getDate() === today.getDate()
        && d.getMonth() === today.getMonth()
        && d.getFullYear() === today.getFullYear()
        && a.status === 'CONFIRMED'
        && a.patientEmail !== a.doctorEmail;
    });
  });

  readonly pendingAppointmentsCount = computed(() =>
    this.appointments().filter(a => a.status === 'PENDING').length
  );

  private readonly doctorAppointments = computed(() => {
    const now = new Date();
    const view = this.doctorView();
    let list = this.validAppointments();

    if (this.currentFilter() === 'PENDING') {
      list = list.filter(a => a.status === 'PENDING');
    } else if (view === 'CURRENT') {
      list = list.filter(a => new Date(a.appointmentDate) >= now && a.status !== 'CANCELLED');
    } else if (view === 'PAST') {
      list = list.filter(a => new Date(a.appointmentDate) < now && a.status !== 'CANCELLED');
    } else {
      list = list.filter(a => a.status === 'CANCELLED');
    }

    return [...list].sort(byDateAsc);
  });

  private readonly patientAppointments = computed(() => {
    const now = new Date();
    const upcoming = this.historyView() === 'UPCOMING';
    let list = this.validAppointments().filter(a =>
      upcoming ? new Date(a.appointmentDate) >= now : new Date(a.appointmentDate) < now
    );

    list = [...list].sort(upcoming ? byDateAsc : byDateDesc);

    const filter = this.currentFilter();
    return filter === 'ALL' ? list : list.filter(a => a.status === filter);
  });

  readonly filteredAppointments = computed(() =>
    this.userRole() === 'ROLE_DOCTOR' ? this.doctorAppointments() : this.patientAppointments()
  );

  readonly groupedDoctorAppointments = computed<AppointmentGroup[]>(() => {
    const groups = new Map<string, Appointment[]>();
    for (const appt of this.doctorAppointments()) {
      const label = new Date(appt.appointmentDate).toLocaleDateString('de-DE', {
        weekday: 'long', day: '2-digit', month: 'long', year: 'numeric'
      });
      if (!groups.has(label)) groups.set(label, []);
      groups.get(label)!.push(appt);
    }
    return Array.from(groups.entries()).map(([label, items]) => ({ label, items }));
  });

  readonly summaryCounts = computed<SummaryCounts>(() => {
    const now = new Date();
    const upcoming = this.validAppointments().filter(a => new Date(a.appointmentDate) >= now);
    return {
      pending: upcoming.filter(a => a.status === 'PENDING').length,
      confirmed: upcoming.filter(a => a.status === 'CONFIRMED').length,
      cancelled: upcoming.filter(a => a.status === 'CANCELLED').length,
      all: upcoming.length
    };
  });

  readonly totalPages = computed(() => Math.ceil(this.filteredAppointments().length / ITEMS_PER_PAGE));

  readonly paginatedAppointments = computed(() => {
    const start = (this.currentPage() - 1) * ITEMS_PER_PAGE;
    return this.filteredAppointments().slice(start, start + ITEMS_PER_PAGE);
  });

  // ==== LIFECYCLE ====
  ngOnInit(): void {
    const token = localStorage.getItem('jwt_token');
    if (token) {
      const payload = JSON.parse(atob(token.split('.')[1]));
      this.userRole.set(payload.role);
      this.userEmail.set(payload.sub);
    }
    this.loadAppointments();
  }

  loadAppointments(): void {
    this.isLoading.set(true);
    this.appointmentService.getMyAppointments().subscribe({
      next: (data: Appointment[]) => {
        this.appointments.set(data);
        this.isLoading.set(false);
      },
      error: (err: HttpErrorResponse) => {
        console.error('Fehler beim Laden:', err);
        this.isLoading.set(false);
      }
    });
  }

  // ==== ARZT ====
  setDoctorView(view: DoctorView): void {
    this.doctorView.set(view);
    this.currentFilter.set('ALL');
  }

  showPendingOnly(): void { this.currentFilter.set('PENDING'); }
  resetDoctorFilter(): void { this.currentFilter.set('ALL'); }

  // ==== PATIENT ====
  applyFilter(filterType: string): void {
    this.currentFilter.set(filterType);
    this.currentPage.set(1);
  }

  setHistoryView(view: HistoryView): void {
    this.historyView.set(view);
    this.currentPage.set(1);
  }

  nextPage(): void {
    if (this.currentPage() < this.totalPages()) this.currentPage.update(p => p + 1);
  }

  prevPage(): void {
    if (this.currentPage() > 1) this.currentPage.update(p => p - 1);
  }

  // ==== DIALOG ====
  openStatusDialog(appointment: Appointment): void {
    this.selectedAppointment.set(appointment);
    this.showCancelConfirm.set(false);
    this.showStatusDialog.set(true);
  }

  requestCancel(): void { this.showCancelConfirm.set(true); }
  cancelCancelRequest(): void { this.showCancelConfirm.set(false); }

  confirmCancelFinal(): void {
    this.changeStatus('CANCELLED');
  }

  changeStatus(newStatus: string): void {
    const appointment = this.selectedAppointment();
    if (!appointment) return;

    this.isSubmitting.set(true);
    this.appointmentService.updateAppointmentStatus(appointment.id, newStatus).subscribe({
      next: () => {
        this.messageService.add({ severity: 'success', summary: 'Erfolg', detail: 'Status aktualisiert!' });
        this.showStatusDialog.set(false);
        this.showCancelConfirm.set(false);
        this.isSubmitting.set(false);
        this.loadAppointments();
      },
      error: (err: HttpErrorResponse) => {
        this.isSubmitting.set(false);
        this.messageService.add({ severity: 'error', summary: 'Fehler', detail: err.error?.message || 'Aktion nicht möglich.' });
      }
    });
  }

  quickConfirm(appt: Appointment): void {
    this.selectedAppointment.set(appt);
    this.changeStatus('CONFIRMED');
  }

  quickCancel(appt: Appointment): void {
    this.selectedAppointment.set(appt);
    this.changeStatus('CANCELLED');
  }

  openRescheduleDialog(appt: Appointment): void {
    this.showStatusDialog.set(false);
    this.bookAppointmentModal().openReschedule(appt, this.userRole());
  }

  openNewAppointmentDialog(): void {
    this.bookAppointmentModal().openNew(this.userRole());
  }

  openScheduleDialog(): void {
    this.doctorSettingsModal().openDialog();
  }

  logout(): void {
    localStorage.removeItem('jwt_token');
    window.location.href = '/login';
  }
}