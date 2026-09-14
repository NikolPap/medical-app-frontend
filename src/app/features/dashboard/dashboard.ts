import { Component, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AppointmentService } from '../../core/services/appointment';
import { Appointment } from '../../core/models/appointment.model';
import { BookAppointmentComponent } from './components/book-appointment/book-appointment';
import { DoctorSettingsComponent } from './components/doctor-settings/doctor-settings';

// PRIMENG IMPORTS
import { TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag'; 
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { DialogModule } from 'primeng/dialog';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';


@Component({
  selector: 'app-dashboard',
  standalone: true,
  // Hier registrieren wir unsere beiden neuen Components, damit wir sie im HTML nutzen können!
  imports: [CommonModule, TableModule, TagModule, ButtonModule, CardModule, DialogModule, ToastModule, BookAppointmentComponent, DoctorSettingsComponent],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.scss'
})
export class DashboardComponent implements OnInit {

  // @ViewChild erlaubt uns, direkt mit den Kind-Komponenten zu sprechen!
  @ViewChild('bookAppointmentModal') bookAppointmentModal!: BookAppointmentComponent;
  @ViewChild('doctorSettingsModal') doctorSettingsModal!: DoctorSettingsComponent;

  appointments: Appointment[] = [];
  filteredAppointments: Appointment[] = []; 
  currentFilter: string = 'ALL'; 
  isLoading: boolean = true;
  userRole: string = ''; 

  showStatusDialog: boolean = false;
  selectedAppointment: Appointment | null = null;

  constructor(
    private appointmentService: AppointmentService,
    private messageService: MessageService
  ) {}

  ngOnInit(): void {
    const token = localStorage.getItem('jwt_token');
    if (token) {
      const payload = JSON.parse(atob(token.split('.')[1]));
      this.userRole = payload.role;
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

  // --- FILTER LOGIK FÜR DIE KARTEN ---
  applyFilter(filterType: string) {
    this.currentFilter = filterType;
    const now = new Date();

    const validAppointments = this.appointments.filter(a => 
      !(a.patientEmail === a.doctorEmail && a.status === 'CANCELLED')
    );

    if (filterType === 'ALL') {
      this.filteredAppointments = validAppointments.filter(a => new Date(a.appointmentDate) >= now);
    } else if (filterType === 'PAST') {
      this.filteredAppointments = validAppointments.filter(a => new Date(a.appointmentDate) < now);
    } else {
      this.filteredAppointments = validAppointments.filter(a => 
        a.status === filterType && new Date(a.appointmentDate) >= now
      );
    }
  }

  getCount(filterType: string): number {
    const now = new Date();
    const validAppointments = this.appointments.filter(a => 
      !(a.patientEmail === a.doctorEmail && a.status === 'CANCELLED')
    );

    if (filterType === 'ALL') return validAppointments.filter(a => new Date(a.appointmentDate) >= now).length;
    if (filterType === 'PAST') return validAppointments.filter(a => new Date(a.appointmentDate) < now).length;
    return validAppointments.filter(a => a.status === filterType && new Date(a.appointmentDate) >= now).length;
  }

  // --- TERMIN STATUS ÄNDERN ---
  getSeverity(status: string): "success" | "info" | "warning" | "danger" | "secondary" | "contrast" | undefined {
    switch (status) {
        case 'CONFIRMED': return 'success'; 
        case 'PENDING': return 'warning';   
        case 'CANCELLED': return 'danger';  
        default: return 'info';
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

  // --- DIE NEUEN POP-UP METHODEN ---
  openNewAppointmentDialog() {
    this.bookAppointmentModal.openDialog(); // Sagt dem Kind-Component: "Mach dich auf!"
  }

  openScheduleDialog() {
    this.doctorSettingsModal.openDialog(); // Sagt dem Kind-Component: "Mach dich auf!"
  }
}
