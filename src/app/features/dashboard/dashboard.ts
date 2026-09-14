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

// FULLCALENDAR IMPORTS
// FULLCALENDAR IMPORTS (Der sichere Weg für Angular 17+)
import { FullCalendarModule } from '@fullcalendar/angular';
import { CalendarOptions, EventInput } from '@fullcalendar/core/index.js'; // <-- NEU: Das ".js" am Ende fixt oft den Vite/Esbuild Fehler!
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [
    CommonModule, ReactiveFormsModule, FormsModule, TableModule, TagModule, ButtonModule, CardModule, 
    DialogModule, ToastModule, DropdownModule, CalendarModule, ConfirmDialogModule, AvatarModule, FullCalendarModule,
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

  // --- FULLCALENDAR SETTINGS ---
  calendarOptions: CalendarOptions = {
    initialView: 'timeGridWeek', // Wir starten mit der Wochenansicht (perfekt für Ärzte)
    plugins: [dayGridPlugin, timeGridPlugin, interactionPlugin],
    headerToolbar: {
      left: 'prev,next today',
      center: 'title',
      right: 'dayGridMonth,timeGridWeek,timeGridDay' 
    },
    events: [], 
    eventClick: this.handleEventClick.bind(this), 
    height: '100%',
    slotMinTime: '06:00:00', // Der Kalender beginnt erst um 6 Uhr morgens
    slotMaxTime: '22:00:00'  // Und endet um 22 Uhr
  };

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

        // Fülle den FullCalendar mit den Terminen!
        const calendarEvents: EventInput[] = data.map(appt => {
          const isHoliday = appt.patientEmail === appt.doctorEmail;
          
          return {
            id: appt.id.toString(),
            title: isHoliday ? 'URLAUB' : appt.patientEmail.split('@')[0], 
            start: appt.appointmentDate, 
            backgroundColor: isHoliday ? '#ef4444' : (appt.status === 'CONFIRMED' ? '#22c55e' : '#f97316'), 
            borderColor: 'transparent',
            extendedProps: { status: appt.status }
          };
        });
        this.calendarOptions = { ...this.calendarOptions, events: calendarEvents };
      },
      error: (err: any) => {
        console.error("Fehler beim Laden:", err);
        this.isLoading = false;
      }
    });
  }

  handleEventClick(clickInfo: any) {
    const clickedAppt = this.appointments.find(a => a.id.toString() === clickInfo.event.id);
    if (clickedAppt) {
      this.openStatusDialog(clickedAppt);
    }
  }

  get todaysAppointments(): Appointment[] {
    const today = new Date();
    return this.appointments.filter(a => {
      const apptDate = new Date(a.appointmentDate);
      return apptDate.getDate() === today.getDate() &&
             apptDate.getMonth() === today.getMonth() &&
             apptDate.getFullYear() === today.getFullYear() &&
             a.status === 'CONFIRMED' && 
             a.patientEmail !== a.doctorEmail; // Urlaube hier nicht als "Patienten-Visit" anzeigen
    });
  }

  getInitial(email: string): string {
    return email ? email.charAt(0).toUpperCase() : '?';
  }

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