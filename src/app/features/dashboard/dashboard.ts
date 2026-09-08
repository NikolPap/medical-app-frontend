import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AppointmentService } from '../../core/services/appointment';
import { Appointment } from '../../core/models/appointment.model'
import { Router } from '@angular/router'; 
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ScheduleService } from '../../core/services/schedule';


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

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, TableModule, TagModule, ButtonModule, CardModule, DialogModule, ToastModule, DropdownModule, CalendarModule],
  providers: [MessageService],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.scss'
})
export class DashboardComponent implements OnInit {

  appointments: Appointment[] = [];
  isLoading: boolean = true;

  showStatusDialog: boolean = false;
  selectedAppointment: Appointment | null = null;
  showNewAppointmentDialog: boolean = false;
  newAppointmentForm: FormGroup;
  doctors: any[] = []; 
  userRole: string = ''; 
  minDate: Date = new Date();
  availableSlots: string[] = []; // Hier speichern wir die freien Uhrzeiten (z.B. "09:30")
  selectedTimeSlot: string = ''; // Die Uhrzeit, die der Patient anklickt
  showScheduleDialog: boolean = false;
  scheduleForm: FormGroup;
  mySchedule: any[] = []; 

  constructor(
       private appointmentService: AppointmentService,
    private messageService: MessageService,
    private fb: FormBuilder, 
    private router: Router,
    private scheduleService: ScheduleService
  ) {
      this.newAppointmentForm = this.fb.group({
      doctorId: [null, Validators.required],
      appointmentDate: [null, Validators.required],
      appointmentTime: ['', Validators.required] 
    });

    this.scheduleForm = this.fb.group({
      dayOfWeek: ['', Validators.required],
      startTime: [null, Validators.required],
      endTime: [null, Validators.required]
    });
  }

 ngOnInit(): void {
    // Finde heraus, ob wir Patient oder Arzt sind (aus dem Token)
    const token = localStorage.getItem('jwt_token');
    if (token) {
      const payload = JSON.parse(atob(token.split('.')[1]));
      this.userRole = payload.role;
    }

    this.loadAppointments();
    
    // Wenn wir ein Patient sind, laden wir die Liste der Ärzte für das Buchungs-Formular!
    if (this.userRole === 'ROLE_PATIENT') {
      this.loadDoctors();
    }
  }


  loadAppointments() {
    this.isLoading = true;
    this.appointmentService.getMyAppointments().subscribe({
      next: (data: Appointment[]) => {
        this.appointments = data;
        this.isLoading = false;
      },
      // 2. TYPESCRIPT FIX (err: any)
      error: (err: any) => {
        console.error("Fehler beim Laden:", err);
        this.isLoading = false;
      }
    });
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
      // 3. TYPESCRIPT FIX (err: any)
      error: (err: any) => {
        this.messageService.add({severity: 'error', summary: 'Fehler', detail: err.error?.error || 'Aktion nicht möglich.'});
      }
    });
  }

   logout() {
    // 1. VIP-Bändchen (Token) wegwerfen!
    localStorage.removeItem('jwt_token');
    
    // 2. Zurück zum Login werfen!
    this.router.navigate(['/login']);
  }

  loadDoctors() {
    this.appointmentService.getAllDoctors().subscribe({
      next: (docs) => {
        // Wir machen die Daten schön für das PrimeNG Dropdown
        this.doctors = docs.map(doc => ({ label: doc.email, value: doc.id }));
      }
    });
  }

  openNewAppointmentDialog() {
    this.newAppointmentForm.reset();
    this.showNewAppointmentDialog = true;
  }

 bookAppointment() {
    if (this.newAppointmentForm.invalid) return;

    const rawDate = this.newAppointmentForm.value.appointmentDate;
    
    // Fix: Einmalige Deklaration von Jahr, Monat und Tag für dieses Scope
    const dateObj = new Date(rawDate);
    const appointmentYear = dateObj.getFullYear();
    const appointmentMonth = String(dateObj.getMonth() + 1).padStart(2, '0');
    const appointmentDay = String(dateObj.getDate()).padStart(2, '0');
    const formattedDate = `${appointmentYear}-${appointmentMonth}-${appointmentDay}`;

    const requestData = {
      doctorId: this.newAppointmentForm.value.doctorId,
      appointmentDate: formattedDate,
      appointmentTime: this.newAppointmentForm.value.appointmentTime
    };

    this.appointmentService.createAppointment(requestData).subscribe({
      next: () => {
        this.messageService.add({severity: 'success', summary: 'Erfolg', detail: 'Termin wurde erfolgreich gebucht!'});
        this.showNewAppointmentDialog = false;
        this.loadAppointments();
      },
      error: (err: any) => {
        this.messageService.add({severity: 'error', summary: 'Fehler', detail: err.error?.error || 'Termin konnte nicht gebucht werden.'});
      }
    });
  }

 // Wird aufgerufen, wenn man den Arzt oder das Datum im Formular ändert
  loadAvailableSlots() {
    const doctorId = this.newAppointmentForm.value.doctorId;
    const rawDate = this.newAppointmentForm.value.appointmentDate; // Das ist ein Date-Objekt

    if (doctorId && rawDate) {
      
      // FIX FÜR TIMEZONES: Wir extrahieren Jahr, Monat und Tag lokal und bauen den String selbst ("YYYY-MM-DD")
      const d = new Date(rawDate);
      const year = d.getFullYear();
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      const formattedDate = `${year}-${month}-${day}`;

      this.appointmentService.getAvailableSlots(doctorId, formattedDate).subscribe({
        next: (slots) => {
          this.availableSlots = slots;
          this.selectedTimeSlot = ''; // Reset der Auswahl
          this.newAppointmentForm.patchValue({ appointmentTime: '' }); // Formularfeld leeren
        },
        error: (err) => console.error("Fehler beim Laden der Slots", err)
      });
    }
  }

  // Wird aufgerufen, wenn man auf einen grünen Button (Uhrzeit) klickt
  selectTimeSlot(time: string) {
    this.selectedTimeSlot = time;
    this.newAppointmentForm.patchValue({ appointmentTime: time }); // Ins Formular eintragen
  }

  openScheduleDialog() {
    this.showScheduleDialog = true;
    this.loadMySchedule(); // Lade den bestehenden Plan, wenn das Fenster aufgeht
  }

  loadMySchedule() {
    this.scheduleService.getMySchedule().subscribe({
      next: (data) => this.mySchedule = data,
      error: (err) => console.error("Fehler beim Laden des Plans", err)
    });
  }

  saveSchedule() {
    if (this.scheduleForm.invalid) return;

    // HTML5 <input type="time"> liefert direkt einen String wie "09:00"!
    const requestData = {
      dayOfWeek: this.scheduleForm.value.dayOfWeek,
      startTime: this.scheduleForm.value.startTime, // Keine Konvertierung nötig!
      endTime: this.scheduleForm.value.endTime
    };

    this.scheduleService.saveSchedule(requestData).subscribe({
      next: () => {
        this.messageService.add({severity: 'success', summary: 'Erfolg', detail: 'Arbeitszeit gespeichert!'});
        this.loadMySchedule(); 
      },
      error: (err: any) => {
        this.messageService.add({severity: 'error', summary: 'Fehler', detail: err.error?.error || 'Fehler beim Speichern.'});
      }
    });
  }

  deleteSchedule(scheduleId: number) {
    // Kurze Bestätigung, damit man nicht aus Versehen löscht!
    if (confirm("Möchtest du diese Arbeitszeit wirklich löschen?")) {
      this.scheduleService.deleteSchedule(scheduleId).subscribe({
        next: () => {
          this.messageService.add({severity: 'success', summary: 'Erfolg', detail: 'Arbeitszeit gelöscht!'});
          this.loadMySchedule(); // Liste neu laden
        },
        error: (err: any) => {
          this.messageService.add({severity: 'error', summary: 'Fehler', detail: 'Konnte nicht gelöscht werden.'});
        }
      });
    }
  }
}