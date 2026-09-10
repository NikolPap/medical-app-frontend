import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AppointmentService } from '../../core/services/appointment';
import { Appointment } from '../../core/models/appointment.model'
import { Router } from '@angular/router'; 
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators ,FormsModule} from '@angular/forms';
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
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { ConfirmationService } from 'primeng/api'; 

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule, TableModule, TagModule, ButtonModule, CardModule, 
            DialogModule, ToastModule, DropdownModule, CalendarModule, ConfirmDialogModule], 
  providers: [MessageService, ConfirmationService],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.scss'
})
export class DashboardComponent implements OnInit {

  appointments: Appointment[] = [];
  filteredAppointments: Appointment[] = []; // NEU: Das sind die Termine, die WIRKLICH im Table angezeigt werden!
  currentFilter: string = 'ALL'; // NEU: Welcher Filter ist gerade aktiv? ('ALL', 'CONFIRMED', 'PENDING', 'CANCELLED', 'PAST')
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
  // Optionen für die Dauer eines Termins
  durationOptions = [
    { label: '10 Minuten', value: 10 },
    { label: '15 Minuten', value: 15 },
    { label: '20 Minuten', value: 20 },
    { label: '30 Minuten', value: 30 },
    { label: '40 Minuten', value: 40 },
    { label: '45 Minuten', value: 45 },
    { label: '60 Minuten', value: 60 }
  ];
  selectedDuration: number = 30;
  editingScheduleId: number | null = null;
  blockedDate: Date | null = null;
  groupedSchedule: { dayOfWeek: string, shifts: any[] }[] = [];
  
constructor(
    private appointmentService: AppointmentService,
    private messageService: MessageService,
    private confirmationService: ConfirmationService,
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
    const token = localStorage.getItem('jwt_token');
    if (token) {
      const payload = JSON.parse(atob(token.split('.')[1]));
      this.userRole = payload.role;
    }

    this.loadAppointments();
    
    // NEU: Wir laden die Doktoren-Liste IMMER (Für Patienten fürs Dropdown, für Ärzte für die Dauer)
    this.loadDoctors(); 
  }


  loadAppointments() {
    this.isLoading = true;
    this.appointmentService.getMyAppointments().subscribe({
      next: (data: Appointment[]) => {
        this.appointments = data;
        this.applyFilter(this.currentFilter); 
        
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
        // Für Patienten: Dropdown füllen
        this.doctors = docs.map((doc: any) => ({ label: doc.email, value: doc.id }));
        
        // NEU: Für Ärzte - Finde die EIGENE Dauer heraus und zeige sie an!
        if (this.userRole === 'ROLE_DOCTOR') {
          // Wir lesen die Email aus dem Token
          const token = localStorage.getItem('jwt_token');
          if (token) {
            const payload = JSON.parse(atob(token.split('.')[1]));
            const myEmail = payload.sub; // 'sub' ist die Email im JWT
            
            // Finde den Arzt in der Liste
            const me = docs.find((d: any) => d.email === myEmail);
            if (me && me.slotDuration) {
              this.selectedDuration = me.slotDuration; // Setzt das Dropdown auf den ECHTEN Wert!
            }
          }
        }
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
    this.loadMySchedule(); 
    
    // Wir laden die Doktoren neu, um die GANZ AKTUELLE Termin-Dauer für diesen Arzt zu holen!
    this.appointmentService.getAllDoctors().subscribe({
      next: (docs) => {
        const token = localStorage.getItem('jwt_token');
        if (token) {
          const payload = JSON.parse(atob(token.split('.')[1]));
          const myEmail = payload.sub; 
          
          const me = docs.find((d: any) => d.email === myEmail);
          if (me && me.slotDuration) {
            this.selectedDuration = me.slotDuration; // Setzt die echte Dauer aus der DB!
          }
        }
        this.showScheduleDialog = true; // Öffnet das Fenster ERST, wenn die echten Daten da sind!
      }
    });
  }

  loadMySchedule() {
    this.scheduleService.getMySchedule().subscribe({
      next: (data) => {
        this.mySchedule = data;

        // 2. SORTIERUNG UND GRUPPIERUNG FÜR DAS UI
        const dayOrder: { [key: string]: number } = {
          'MONDAY': 1, 'TUESDAY': 2, 'WEDNESDAY': 3, 'THURSDAY': 4, 'FRIDAY': 5, 'SATURDAY': 6, 'SUNDAY': 7
        };

        // Wir gruppieren die Schichten nach Wochentag
        const groupedMap = new Map<string, any[]>();
        
        data.forEach((s: any) => {
          if (!groupedMap.has(s.dayOfWeek)) {
            groupedMap.set(s.dayOfWeek, []);
          }
          groupedMap.get(s.dayOfWeek)?.push(s);
        });

        // Wir verwandeln die Map zurück in ein Array und sortieren die Tage!
        this.groupedSchedule = Array.from(groupedMap.entries()).map(([day, shifts]) => {
          // Sortiere die Schichten INHALB des Tages nach Startzeit
          shifts.sort((a: any, b: any) => a.startTime.localeCompare(b.startTime));
          return { dayOfWeek: day, shifts: shifts };
        }).sort((a, b) => dayOrder[a.dayOfWeek] - dayOrder[b.dayOfWeek]);

      },
      error: (err) => console.error("Fehler beim Laden des Plans", err)
    });
  }

  saveSchedule() {
    if (this.scheduleForm.invalid) return;

    const requestData = {
      dayOfWeek: this.scheduleForm.value.dayOfWeek,
      startTime: this.scheduleForm.value.startTime, 
      endTime: this.scheduleForm.value.endTime
    };

    // Wenn wir im "Edit-Modus" sind, löschen wir zuerst die alte Schicht
    if (this.editingScheduleId !== null) {
      this.scheduleService.deleteSchedule(this.editingScheduleId).subscribe({
        next: () => {
          this.editingScheduleId = null; // Edit-Modus beenden
          this.sendSaveRequest(requestData); // Jetzt die neue speichern
        }
      });
    } else {
      // Normaler Speichern-Vorgang
      this.sendSaveRequest(requestData);
    }
  }

  // Hilfsmethode, um doppelten Code zu vermeiden
  private sendSaveRequest(requestData: any) {
    this.scheduleService.saveSchedule(requestData).subscribe({
      next: () => {
        this.messageService.add({severity: 'success', summary: 'Erfolg', detail: 'Arbeitszeit gespeichert!'});
        this.scheduleForm.reset(); // Formular leeren
        this.loadMySchedule(); 
      },
      error: (err: any) => {
        this.messageService.add({severity: 'error', summary: 'Fehler', detail: err.error?.error || 'Fehler beim Speichern.'});
      }
    });
  }

 deleteSchedule(scheduleId: number) {
    this.confirmationService.confirm({
      message: 'Möchtest du diese Arbeitszeit wirklich löschen?',
      header: 'Bestätigung',
      icon: 'pi pi-exclamation-triangle',
      acceptLabel: 'Ja, Löschen',
      rejectLabel: 'Abbrechen',
      acceptButtonStyleClass: 'p-button-danger p-2 px-4 rounded-md',
      rejectButtonStyleClass: 'p-button-text p-2 px-4 rounded-md',
      accept: () => {
        this.scheduleService.deleteSchedule(scheduleId).subscribe({
          next: () => {
            this.messageService.add({severity: 'success', summary: 'Erfolg', detail: 'Arbeitszeit gelöscht!'});
            this.loadMySchedule(); 
          },
          error: (err: any) => {
            this.messageService.add({severity: 'error', summary: 'Fehler', detail: 'Konnte nicht gelöscht werden.'});
          }
        });
      }
    });
  }

  saveDuration() {
    this.scheduleService.updateSlotDuration(this.selectedDuration).subscribe({
      next: () => {
        this.messageService.add({severity: 'success', summary: 'Erfolg', detail: `Dauer auf ${this.selectedDuration} Min. geändert!`});
        // ERZWINGE UI-UPDATE: Lade die aktuelle Dauer direkt neu!
        this.openScheduleDialog(); 
      },
      error: (err: any) => {
        this.messageService.add({severity: 'error', summary: 'Fehler', detail: err.error?.error || 'Konnte Dauer nicht ändern.'});
      }
    });
  }

editSchedule(schedule: any) {
    // Wir merken uns, welche Schicht wir bearbeiten!
    this.editingScheduleId = schedule.id; 

    // Wir füllen das Formular
    this.scheduleForm.patchValue({
      dayOfWeek: schedule.dayOfWeek,
      startTime: schedule.startTime.substring(0, 5), 
      endTime: schedule.endTime.substring(0, 5)
    });

    this.messageService.add({severity: 'info', summary: 'Bearbeiten', detail: 'Bitte ändern und speichern!'});
  }

 blockDay() {
    if (!this.blockedDate) return;

    const d = new Date(this.blockedDate);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    const formattedDate = `${year}-${month}-${day}`;

    this.confirmationService.confirm({
      message: `Möchtest du den ${formattedDate} wirklich komplett blockieren?`,
      header: 'Urlaub eintragen',
      icon: 'pi pi-info-circle',
      acceptLabel: 'Ja, Tag blockieren',
      rejectLabel: 'Abbrechen',
      acceptButtonStyleClass: 'p-button-warning p-2 px-4 rounded-md',
      rejectButtonStyleClass: 'p-button-text p-2 px-4 rounded-md',
      accept: () => {
        this.appointmentService.blockEntireDay(formattedDate).subscribe({
          next: () => {
            this.messageService.add({severity: 'success', summary: 'Erfolg', detail: 'Tag wurde blockiert!'});
            this.blockedDate = null; 
            this.loadAppointments(); 
          },
          error: (err: any) => {
            this.messageService.add({severity: 'error', summary: 'Fehler', detail: err.error?.error || 'Tag konnte nicht blockiert werden.'});
          }
        });
      }
    });
  }

  // FILTER-LOGIK FÜR DIE 4 KARTEN
  applyFilter(filterType: string) {
    this.currentFilter = filterType;
    const now = new Date();

    if (filterType === 'ALL') {
      // Zeige alle ZUKÜNFTIGEN Termine an (egal welcher Status)
      this.filteredAppointments = this.appointments.filter(a => new Date(a.appointmentDate) >= now);
    } 
    else if (filterType === 'PAST') {
      // Zeige NUR Termine aus der Vergangenheit (Vergangene)
      this.filteredAppointments = this.appointments.filter(a => new Date(a.appointmentDate) < now);
    } 
    else {
      // Zeige Termine basierend auf dem Status (CONFIRMED, PENDING, CANCELLED), 
      // aber NUR wenn sie in der Zukunft liegen!
      this.filteredAppointments = this.appointments.filter(a => 
        a.status === filterType && new Date(a.appointmentDate) >= now
      );
    }
  }

  // Hilfsmethode, um die Anzahl für die Karten zu zählen
  getCount(filterType: string): number {
    const now = new Date();
    if (filterType === 'ALL') return this.appointments.filter(a => new Date(a.appointmentDate) >= now).length;
    if (filterType === 'PAST') return this.appointments.filter(a => new Date(a.appointmentDate) < now).length;
    return this.appointments.filter(a => a.status === filterType && new Date(a.appointmentDate) >= now).length;
  }
}

