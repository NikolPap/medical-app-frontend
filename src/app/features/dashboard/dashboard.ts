import { Component, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AppointmentService } from '../../core/services/appointment';
import { Appointment } from '../../core/models/appointment.model';
import { Router } from '@angular/router'; 
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators, FormsModule } from '@angular/forms';
import { ScheduleService } from '../../core/services/schedule';
import { HolidayService } from '../../core/services/holiday';

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
  currentFilter: string = 'ALL'; 
  isLoading: boolean = true;
  
  userRole: string = ''; 
  userEmail: string = ''; 
  minDate: Date = new Date();

  showStatusDialog: boolean = false;
  selectedAppointment: Appointment | null = null;

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
        this.applyFilter(this.currentFilter); 
        this.isLoading = false;
      },
      error: (err: any) => {
        console.error("Fehler beim Laden:", err);
        this.isLoading = false;
      }
    });
  }

  // Gibt nur die bestätigten Termine von HEUTE zurück (Für die linke Spalte beim Arzt)
  get todaysAppointments(): Appointment[] {
    const today = new Date();
    return this.appointments.filter(a => {
      const apptDate = new Date(a.appointmentDate);
      return apptDate.getDate() === today.getDate() &&
             apptDate.getMonth() === today.getMonth() &&
             apptDate.getFullYear() === today.getFullYear() &&
             a.status === 'CONFIRMED' && 
             a.patientEmail !== a.doctorEmail; // Urlaube ausblenden
    });
  }

  // Holt den ersten Buchstaben der E-Mail für das Avatar-Bild
  getInitial(email: string): string {
    return email ? email.charAt(0).toUpperCase() : '?';
  }

  // --- FILTER LOGIK FÜR DIE KARTEN ---
  applyFilter(filterType: string) {
    this.currentFilter = filterType;
    const now = new Date();

    const validAppointments = this.appointments.filter(a => !(a.patientEmail === a.doctorEmail && a.status === 'CANCELLED'));

    if (filterType === 'ALL') {
      this.filteredAppointments = validAppointments.filter(a => new Date(a.appointmentDate) >= now);
    } else if (filterType === 'PAST') {
      this.filteredAppointments = validAppointments.filter(a => new Date(a.appointmentDate) < now);
    } else {
      this.filteredAppointments = validAppointments.filter(a => a.status === filterType && new Date(a.appointmentDate) >= now);
    }
  }

  getCount(filterType: string): number {
    const now = new Date();
    const validAppointments = this.appointments.filter(a => !(a.patientEmail === a.doctorEmail && a.status === 'CANCELLED'));

    if (filterType === 'ALL') return validAppointments.filter(a => new Date(a.appointmentDate) >= now).length;
    if (filterType === 'PAST') return validAppointments.filter(a => new Date(a.appointmentDate) < now).length;
    return validAppointments.filter(a => a.status === filterType && new Date(a.appointmentDate) >= now).length;
  }

  // NEU: Custom Tailwind Classes für unsere Boutique-Farbpalette!
  getStatusClasses(status: string): string {
    switch (status) {
        case 'CONFIRMED': return 'bg-status-sage/10 text-status-sage border border-status-sage/20'; // Sage Green
        case 'PENDING': return 'bg-status-ochre/10 text-status-ochre border border-status-ochre/20'; // Warm Ochre
        case 'CANCELLED': return 'bg-status-brick/10 text-status-brick border border-status-brick/20'; // Brick Red
        default: return 'bg-gray-100 text-gray-600 border border-gray-200';
    }
  }

  openStatusDialog(appointment: Appointment) {
    this.selectedAppointment = appointment;
    this.showStatusDialog = true; 
  }

  changeStatus(newStatus: string) {
    if (!this.selectedAppointment) return;

    this.appointmentService.updateAppointmentStatus(this.selectedAppointment.id, newStatus).subscribe({
      next: () => {
        this.messageService.add({severity: 'success', summary: 'Erfolg', detail: 'Status wurde aktualisiert!'});
        this.showStatusDialog = false; 
        this.loadAppointments(); 
      },
      error: (err: any) => {
        this.messageService.add({severity: 'error', summary: 'Fehler', detail: err.error?.error || 'Aktion nicht möglich.'});
      }
    });
  }

  // --- NAVIGATION & POPUPS ---
  logout() {
    localStorage.removeItem('jwt_token');
    window.location.href = '/login'; 
  }

  openNewAppointmentDialog() {
    this.bookAppointmentModal.openDialog(); 
  }

  openScheduleDialog() {
    this.doctorSettingsModal.openDialog(); 
  }
}