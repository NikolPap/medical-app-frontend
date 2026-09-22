import { Component, EventEmitter, OnInit, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { AppointmentService } from '../../../../core/services/appointment';
import { DoctorInfo } from '../../../../core/models/appointment.model';
import { MessageService } from 'primeng/api';
import { HttpErrorResponse } from '@angular/common/http';

import { DialogModule } from 'primeng/dialog';
import { DropdownModule } from 'primeng/dropdown';
import { CalendarModule } from 'primeng/calendar';
import { ButtonModule } from 'primeng/button';

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
  doctors: { label: string, value: number }[] = []; 
  minDate: Date = new Date();
  availableSlots: string[] = [];
  selectedTimeSlot: string = '';

  // FÜR DAS VERSCHIEBEN (RESCHEDULE)
  patientEmailToReschedule: string | null = null; 
  oldAppointmentIdToCancel: number | null = null; // NEU: Welcher Termin soll storniert werden?
  userRole: string = ''; // NEU: Wer bucht gerade?

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
      next: (docs: DoctorInfo[]) => {
        this.doctors = docs.map(doc => ({ label: `Dr. ${doc.lastName} (${doc.specialty || 'Allgemein'})`, value: doc.id }));
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

    const requestData = {
      doctorId: this.newAppointmentForm.value.doctorId,
      appointmentDate: formattedDate,
      appointmentTime: this.newAppointmentForm.value.appointmentTime,
      patientEmail: this.patientEmailToReschedule 
    };

    // 1. Neuen Termin buchen
    this.appointmentService.createAppointment(requestData).subscribe({
      next: (response: any) => {
        
        // 2. Wenn es ein VERSCHIEBEN war, löschen (stornieren) wir den alten Termin!
        if (this.oldAppointmentIdToCancel !== null) {
          this.appointmentService.updateAppointmentStatus(this.oldAppointmentIdToCancel, 'CANCELLED').subscribe({
            next: () => {
              // 3. Wenn es der ARZT war, der verschoben hat, setzen wir den NEUEN Termin sofort auf CONFIRMED!
              if (this.userRole === 'ROLE_DOCTOR') {
                this.appointmentService.updateAppointmentStatus(response.id, 'CONFIRMED').subscribe({
                  next: () => this.finishBooking('Termin erfolgreich verschoben und bestätigt!')
                });
              } else {
                this.finishBooking('Termin erfolgreich verschoben! Wartet auf Bestätigung.');
              }
            }
          });
        } 
        // Normaler Buchungsvorgang (Kein Verschieben)
        else {
          this.finishBooking('Termin wurde erfolgreich gebucht!');
        }
      },
      error: (err: HttpErrorResponse) => {
        this.messageService.add({severity: 'error', summary: 'Fehler', detail: err.error?.error || 'Termin konnte nicht gebucht werden.'});
      }
    });
  }

  // Hilfsmethode, um den Dialog sauber zu schließen
  private finishBooking(successMessage: string) {
    this.messageService.add({severity: 'success', summary: 'Erfolg', detail: successMessage});
    this.showDialog = false;
    this.oldAppointmentIdToCancel = null; // Reset
    this.patientEmailToReschedule = null; // Reset
    this.appointmentBooked.emit(); 
  }
}