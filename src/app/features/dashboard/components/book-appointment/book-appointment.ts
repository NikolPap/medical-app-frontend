
import { Component, EventEmitter, OnInit, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { AppointmentService } from '../../../../core/services/appointment';
import { DoctorInfo } from '../../../../core/models/appointment.model';
import { MessageService } from 'primeng/api';
import { HttpErrorResponse } from '@angular/common/http';
 
import { DialogModule } from 'primeng/dialog';
import { SelectModule } from 'primeng/select';
import { DatePickerModule } from 'primeng/datepicker';
import { ButtonModule } from 'primeng/button';
 
@Component({
  selector: 'app-book-appointment',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, DialogModule, SelectModule, DatePickerModule, ButtonModule],
  templateUrl: './book-appointment.html'
})
export class BookAppointmentComponent implements OnInit {
 
  @Output() appointmentBooked = new EventEmitter<void>();
 
  showDialog: boolean = false;
  newAppointmentForm: FormGroup;
  doctors: { label: string, value: number, specialty?: string }[] = [];
  minDate: Date = new Date();
  availableSlots: string[] = [];
  selectedTimeSlot: string = '';
  isLoadingSlots: boolean = false;
  isBooking: boolean = false;
 
  // FÜR DAS VERSCHIEBEN (RESCHEDULE)
  patientEmailToReschedule: string | null = null;
  oldAppointmentIdToCancel: number | null = null;
  userRole: string = '';
 
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
        this.doctors = docs.map(doc => ({
          label: `Dr. ${doc.lastName} (${doc.specialty || 'Allgemein'})`,
          value: doc.id,
          specialty: doc.specialty || 'Allgemeinmedizin'
        }));
      }
    });
  }
 
  get isRescheduleMode(): boolean {
    return this.oldAppointmentIdToCancel !== null;
  }
 
  get selectedDoctor(): { label: string, value: number, specialty?: string } | undefined {
    return this.doctors.find(d => d.value === this.newAppointmentForm.value.doctorId);
  }
 
  // Slots gruppiert nach Vormittag / Nachmittag
  get morningSlots(): string[] {
    return this.availableSlots.filter(t => parseInt(t.split(':')[0], 10) < 12);
  }
 
  get afternoonSlots(): string[] {
    return this.availableSlots.filter(t => parseInt(t.split(':')[0], 10) >= 12);
  }
 
  openDialog() {
    this.newAppointmentForm.reset();
    this.availableSlots = [];
    this.selectedTimeSlot = '';
    this.showDialog = true;
  }
 
  private formatDate(raw: Date): string {
    const d = new Date(raw);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  }
 
  loadAvailableSlots() {
    const doctorId = this.newAppointmentForm.value.doctorId;
    const rawDate = this.newAppointmentForm.value.appointmentDate;
 
    if (doctorId && rawDate) {
      const formattedDate = this.formatDate(rawDate);
 
      this.isLoadingSlots = true;
      this.availableSlots = [];
      this.selectedTimeSlot = '';
      this.newAppointmentForm.patchValue({ appointmentTime: '' });
 
      this.appointmentService.getAvailableSlots(doctorId, formattedDate).subscribe({
        next: (slots: string[]) => {
          this.availableSlots = slots;
          this.isLoadingSlots = false;
        },
        error: (err: HttpErrorResponse) => {
          this.isLoadingSlots = false;
          console.error('Fehler beim Laden der Slots', err);
        }
      });
    }
  }
 
  selectTimeSlot(time: string) {
    this.selectedTimeSlot = time;
    this.newAppointmentForm.patchValue({ appointmentTime: time });
  }
 
  bookAppointment() {
    if (this.newAppointmentForm.invalid) return;
 
    const { doctorId, appointmentDate, appointmentTime } = this.newAppointmentForm.value;
    const formattedDate = this.formatDate(appointmentDate);
 
    this.isBooking = true;
 
    // VERSCHIEBEN: ein einziger atomarer Request
    if (this.oldAppointmentIdToCancel !== null) {
      this.appointmentService
        .rescheduleAppointment(this.oldAppointmentIdToCancel, { appointmentDate: formattedDate, appointmentTime })
        .subscribe({
          next: () => this.finishBooking(
            this.userRole === 'ROLE_DOCTOR'
              ? 'Termin erfolgreich verschoben und bestätigt!'
              : 'Termin erfolgreich verschoben! Wartet auf Bestätigung.'),
          error: (err: HttpErrorResponse) => this.handleBookingError(err, 'Termin konnte nicht verschoben werden.')
        });
      return;
    }
 
    // NEU BUCHEN
    this.appointmentService
      .createAppointment({ doctorId, appointmentDate: formattedDate, appointmentTime, patientEmail: this.patientEmailToReschedule })
      .subscribe({
        next: () => this.finishBooking('Termin wurde erfolgreich gebucht!'),
        error: (err: HttpErrorResponse) => this.handleBookingError(err, 'Termin konnte nicht gebucht werden.')
      });
  }
 
  private handleBookingError(err: HttpErrorResponse, fallback: string) {
    this.isBooking = false;
    this.messageService.add({ severity: 'error', summary: 'Fehler', detail: err.error?.message || fallback });
  }
 
  private finishBooking(successMessage: string) {
    this.isBooking = false;
    this.messageService.add({ severity: 'success', summary: 'Erfolg', detail: successMessage });
    this.showDialog = false;
    this.oldAppointmentIdToCancel = null;
    this.patientEmailToReschedule = null;
    this.appointmentBooked.emit();
  }
}