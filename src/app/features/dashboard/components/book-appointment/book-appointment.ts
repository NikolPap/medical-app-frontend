import { Component, OnInit, computed, inject, output, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';
import { DatePipe, NgClass } from '@angular/common';

import { DialogModule } from 'primeng/dialog';
import { SelectModule } from 'primeng/select';
import { DatePickerModule } from 'primeng/datepicker';
import { ButtonModule } from 'primeng/button';
import { MessageService } from 'primeng/api';

import { AppointmentService } from '../../../../core/services/appointment';
import { Appointment, DoctorInfo } from '../../../../core/models/appointment.model';

interface DoctorOption {
  label: string;
  value: number;
  specialty?: string;
}

@Component({
  selector: 'app-book-appointment',
  standalone: true,
  imports: [NgClass, DatePipe, ReactiveFormsModule, DialogModule, SelectModule, DatePickerModule, ButtonModule],
  templateUrl: './book-appointment.html'
})
export class BookAppointmentComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly appointmentService = inject(AppointmentService);
  private readonly messageService = inject(MessageService);

  readonly appointmentBooked = output<void>();

  readonly showDialog = signal(false);
  readonly doctors = signal<DoctorOption[]>([]);
  readonly availableSlots = signal<string[]>([]);
  readonly selectedTimeSlot = signal('');
  readonly isLoadingSlots = signal(false);
  readonly isBooking = signal(false);
  readonly minDate = new Date();

  // Für das Verschieben (Reschedule)
  private readonly oldAppointmentIdToCancel = signal<number | null>(null);
  private readonly patientEmailToReschedule = signal<string | null>(null);
  private readonly userRole = signal('');

  readonly newAppointmentForm: FormGroup = this.fb.group({
    doctorId: [null, Validators.required],
    appointmentDate: [null, Validators.required],
    appointmentTime: ['', Validators.required]
  });

  private readonly formValue = toSignal(this.newAppointmentForm.valueChanges, {
    initialValue: this.newAppointmentForm.value
  });

  readonly isRescheduleMode = computed(() => this.oldAppointmentIdToCancel() !== null);

  readonly selectedDoctor = computed(() =>
    this.doctors().find(d => d.value === this.formValue().doctorId)
  );

  // Slots gruppiert nach Vormittag / Nachmittag
  readonly morningSlots = computed(() =>
    this.availableSlots().filter(t => parseInt(t.split(':')[0], 10) < 12)
  );

  readonly afternoonSlots = computed(() =>
    this.availableSlots().filter(t => parseInt(t.split(':')[0], 10) >= 12)
  );

  ngOnInit(): void {
    this.loadDoctors();
  }

  private loadDoctors(): void {
    this.appointmentService.getAllDoctors().subscribe({
      next: (docs: DoctorInfo[]) => {
        this.doctors.set(docs.map(doc => ({
          label: `Dr. ${doc.lastName} (${doc.specialty || 'Allgemein'})`,
          value: doc.id,
          specialty: doc.specialty || 'Allgemeinmedizin'
        })));
      }
    });
  }

  // ==== Öffnen ====
  openNew(role: string): void {
    this.oldAppointmentIdToCancel.set(null);
    this.patientEmailToReschedule.set(null);
    this.userRole.set(role);
    this.openDialog();
  }

  openReschedule(appt: Appointment, role: string): void {
    this.oldAppointmentIdToCancel.set(appt.id);
    this.patientEmailToReschedule.set(appt.patientEmail);
    this.userRole.set(role);
    this.openDialog();

    if (appt.doctorId) {
      this.newAppointmentForm.patchValue({ doctorId: appt.doctorId });
    }
  }

  private openDialog(): void {
    this.newAppointmentForm.reset();
    this.availableSlots.set([]);
    this.selectedTimeSlot.set('');
    this.showDialog.set(true);
  }

  private formatDate(raw: Date): string {
    const d = new Date(raw);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  }

  loadAvailableSlots(): void {
    const doctorId = this.newAppointmentForm.value.doctorId;
    const rawDate = this.newAppointmentForm.value.appointmentDate;

    if (!doctorId || !rawDate) return;

    this.isLoadingSlots.set(true);
    this.availableSlots.set([]);
    this.selectedTimeSlot.set('');
    this.newAppointmentForm.patchValue({ appointmentTime: '' });

    this.appointmentService.getAvailableSlots(doctorId, this.formatDate(rawDate)).subscribe({
      next: (slots: string[]) => {
        this.availableSlots.set(slots);
        this.isLoadingSlots.set(false);
      },
      error: (err: HttpErrorResponse) => {
        this.isLoadingSlots.set(false);
        console.error('Fehler beim Laden der Slots', err);
      }
    });
  }

  selectTimeSlot(time: string): void {
    this.selectedTimeSlot.set(time);
    this.newAppointmentForm.patchValue({ appointmentTime: time });
  }

  bookAppointment(): void {
    if (this.newAppointmentForm.invalid) return;

    const { doctorId, appointmentDate, appointmentTime } = this.newAppointmentForm.value;
    const formattedDate = this.formatDate(appointmentDate);
    const oldId = this.oldAppointmentIdToCancel();

    this.isBooking.set(true);

    // VERSCHIEBEN: ein einziger atomarer Request
    if (oldId !== null) {
      this.appointmentService
        .rescheduleAppointment(oldId, { appointmentDate: formattedDate, appointmentTime })
        .subscribe({
          next: () => this.finishBooking(
            this.userRole() === 'ROLE_DOCTOR'
              ? 'Termin erfolgreich verschoben und bestätigt!'
              : 'Termin erfolgreich verschoben! Wartet auf Bestätigung.'),
          error: (err: HttpErrorResponse) => this.handleBookingError(err, 'Termin konnte nicht verschoben werden.')
        });
      return;
    }

    // NEU BUCHEN
    this.appointmentService
      .createAppointment({ doctorId, appointmentDate: formattedDate, appointmentTime, patientEmail: this.patientEmailToReschedule() })
      .subscribe({
        next: () => this.finishBooking('Termin wurde erfolgreich gebucht!'),
        error: (err: HttpErrorResponse) => this.handleBookingError(err, 'Termin konnte nicht gebucht werden.')
      });
  }

  private handleBookingError(err: HttpErrorResponse, fallback: string): void {
    this.isBooking.set(false);
    this.messageService.add({ severity: 'error', summary: 'Fehler', detail: err.error?.message || fallback });
  }

  private finishBooking(successMessage: string): void {
    this.isBooking.set(false);
    this.messageService.add({ severity: 'success', summary: 'Erfolg', detail: successMessage });
    this.showDialog.set(false);
    this.oldAppointmentIdToCancel.set(null);
    this.patientEmailToReschedule.set(null);
    this.appointmentBooked.emit();
  }
}