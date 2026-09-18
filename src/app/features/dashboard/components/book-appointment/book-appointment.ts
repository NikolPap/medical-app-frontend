import { Component, EventEmitter, OnInit, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { AppointmentService } from '../../../../core/services/appointment';
import { MessageService } from 'primeng/api';

import { DialogModule } from 'primeng/dialog';
import { DropdownModule } from 'primeng/dropdown';
import { CalendarModule } from 'primeng/calendar';
import { ButtonModule } from 'primeng/button';
import { HttpErrorResponse } from '@angular/common/http';

@Component({
  selector: 'app-book-appointment',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, DialogModule, DropdownModule, CalendarModule, ButtonModule],
  templateUrl: './book-appointment.html'
})
export class BookAppointmentComponent implements OnInit {

  @Output() appointmentBooked = new EventEmitter<void>(); 

  showDialog: boolean = false;
  newAppointmentForm: FormGroup;
  
  // STRICKT TYPISIERT
  doctors: { label: string, value: number }[] = []; 
  
  minDate: Date = new Date();
  availableSlots: string[] = [];
  selectedTimeSlot: string = '';
  patientEmailToReschedule: string | null = null;


  constructor(
    private fb: FormBuilder,
    private appointmentService: AppointmentService,
    private messageService: MessageService
  ) {
    this.newAppointmentForm = this.fb.group({
      doctorId: [null, Validators.required],
      appointmentDate: [null, Validators.required],
      appointmentTime: ['', Validators.required]
    });
  }

  ngOnInit() {
    this.loadDoctors();
  }

  loadDoctors() {
    this.appointmentService.getAllDoctors().subscribe({
      next: (docs: { email: string, id: number }[]) => {
        this.doctors = docs.map(doc => ({ label: doc.email, value: doc.id }));
      }
    });
  }

  openDialog() {
    this.newAppointmentForm.reset();
    this.availableSlots = [];
    this.selectedTimeSlot = '';
    this.showDialog = true;
  }

  loadAvailableSlots() {
    const doctorId = this.newAppointmentForm.value.doctorId;
    const rawDate = this.newAppointmentForm.value.appointmentDate;

    if (doctorId && rawDate) {
      const d = new Date(rawDate);
      const formattedDate = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

      this.appointmentService.getAvailableSlots(doctorId, formattedDate).subscribe({
        next: (slots: string[]) => {
          this.availableSlots = slots;
          this.selectedTimeSlot = '';
          this.newAppointmentForm.patchValue({ appointmentTime: '' });
        },
        error: (err: HttpErrorResponse) => console.error("Fehler beim Laden der Slots", err)
      });
    }
  }

  selectTimeSlot(time: string) {
    this.selectedTimeSlot = time;
    this.newAppointmentForm.patchValue({ appointmentTime: time });
  }

 bookAppointment() {
    if (this.newAppointmentForm.invalid) return;

    const rawDate = this.newAppointmentForm.value.appointmentDate;
    const dateObj = new Date(rawDate);
    const formattedDate = `${dateObj.getFullYear()}-${String(dateObj.getMonth() + 1).padStart(2, '0')}-${String(dateObj.getDate()).padStart(2, '0')}`;

    // NEU: Wir packen die patientEmail in den Request (Java braucht das, wenn ein Arzt bucht!)
    const requestData = {
      doctorId: this.newAppointmentForm.value.doctorId,
      appointmentDate: formattedDate,
      appointmentTime: this.newAppointmentForm.value.appointmentTime,
      patientEmail: this.patientEmailToReschedule // <-- HIER IST DIE MAGIE!
    };

    this.appointmentService.createAppointment(requestData).subscribe({
      next: () => {
        this.messageService.add({severity: 'success', summary: 'Erfolg', detail: 'Termin wurde erfolgreich gebucht!'});
        this.showDialog = false;
        this.appointmentBooked.emit(); 
      },
      error: (err: any) => { // Hier eventuell HttpErrorResponse nutzen
        this.messageService.add({severity: 'error', summary: 'Fehler', detail: err.error?.error || 'Termin konnte nicht gebucht werden.'});
      }
    });
  }
}