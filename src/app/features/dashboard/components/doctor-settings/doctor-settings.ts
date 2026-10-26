import { Component, OnInit, computed, inject, output, signal } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { DatePipe, NgClass } from '@angular/common';
import { ReactiveFormsModule, FormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { forkJoin, of } from 'rxjs';
import { catchError } from 'rxjs/operators';

import { MessageService, ConfirmationService } from 'primeng/api';
import { DialogModule } from 'primeng/dialog';
import { SelectModule } from 'primeng/select';
import { DatePickerModule } from 'primeng/datepicker';
import { ButtonModule } from 'primeng/button';
import { TooltipModule } from 'primeng/tooltip';
import { ConfirmDialogModule } from 'primeng/confirmdialog';

import { AppointmentService } from '../../../../core/services/appointment';
import { ScheduleService } from '../../../../core/services/schedule';
import { HolidayService } from '../../../../core/services/holiday';
import { DoctorSchedule, DoctorHoliday, DoctorInfo } from '../../../../core/models/appointment.model';

const DAY_LABELS: Record<string, string> = {
  MONDAY: 'Mo', TUESDAY: 'Di', WEDNESDAY: 'Mi', THURSDAY: 'Do', FRIDAY: 'Fr', SATURDAY: 'Sa', SUNDAY: 'So'
};

const WEEK_DAY_KEYS = ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY', 'SUNDAY'];

interface HolidayGroup {
  startDate: string;
  endDate: string;
  ids: number[];
}

// Felder, die das Backend liefert, aber im Basis-Modell evtl. nicht stehen
type DoctorWithSlot = DoctorInfo & { email?: string; slotDuration?: number };

const toIsoDate = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

const toMinutes = (time: string): number => {
  const [h, m] = time.split(':').map(Number);
  return h * 60 + m;
};

@Component({
  selector: 'app-doctor-settings',
  standalone: true,
  imports: [
    NgClass, DatePipe, ReactiveFormsModule, FormsModule,
    DialogModule, SelectModule, DatePickerModule, ButtonModule, TooltipModule, ConfirmDialogModule
  ],
  providers: [ConfirmationService],
  templateUrl: './doctor-settings.html'
})
export class DoctorSettingsComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly appointmentService = inject(AppointmentService);
  private readonly scheduleService = inject(ScheduleService);
  private readonly holidayService = inject(HolidayService);
  private readonly messageService = inject(MessageService);
  private readonly confirmationService = inject(ConfirmationService);

  readonly settingsChanged = output<void>();

  readonly showDialog = signal(false);
  readonly minDate = new Date();

  // --- DAUER ---
  readonly durationOptions = [10, 15, 20, 30, 40, 45, 60].map(v => ({ label: `${v} Minuten`, value: v }));
  readonly selectedDuration = signal(30);
  readonly isSavingDuration = signal(false);

  // --- URLAUB ---
  readonly blockedDate = signal<Date | Date[] | null>(null);
  readonly myHolidays = signal<DoctorHoliday[]>([]);
  readonly isSavingHoliday = signal(false);

  /** Aufeinanderfolgende Urlaubstage werden zu einem Zeitraum zusammengefasst */
  readonly groupedHolidays = computed<HolidayGroup[]>(() => {
    const sorted = [...this.myHolidays()].sort(
      (a, b) => new Date(a.holidayDate).getTime() - new Date(b.holidayDate).getTime()
    );
    if (sorted.length === 0) return [];

    const groups: HolidayGroup[] = [];
    let current: HolidayGroup = { startDate: sorted[0].holidayDate, endDate: sorted[0].holidayDate, ids: [sorted[0].id] };

    for (let i = 1; i < sorted.length; i++) {
      const prev = new Date(sorted[i - 1].holidayDate);
      const next = new Date(sorted[i].holidayDate);
      const diffDays = Math.ceil(Math.abs(next.getTime() - prev.getTime()) / (1000 * 60 * 60 * 24));

      if (diffDays === 1) {
        current.endDate = sorted[i].holidayDate;
        current.ids.push(sorted[i].id);
      } else {
        groups.push(current);
        current = { startDate: sorted[i].holidayDate, endDate: sorted[i].holidayDate, ids: [sorted[i].id] };
      }
    }
    groups.push(current);
    return groups;
  });

  // --- SCHICHTEN ---
  readonly scheduleForm: FormGroup = this.fb.group({
    dayOfWeek: ['', Validators.required],
    startTime: [null, Validators.required],
    endTime: [null, Validators.required]
  });
  readonly mySchedule = signal<DoctorSchedule[]>([]);
  readonly editingScheduleId = signal<number | null>(null);
  readonly isSavingSchedule = signal(false);

  readonly weekDayKeys = WEEK_DAY_KEYS;

  readonly weekGrid = computed(() =>
    WEEK_DAY_KEYS.map(key => ({
      key,
      label: DAY_LABELS[key],
      shifts: this.mySchedule()
        .filter(s => s.dayOfWeek === key)
        .sort((a, b) => (a.startTime || '').localeCompare(b.startTime || ''))
    }))
  );

  // --- KOPIEREN AUF ANDERE TAGE ---
  /** Das Kopier-Panel ist sichtbar, sobald ein Quelltag gesetzt ist */
  readonly copySourceDay = signal<string | null>(null);
  readonly copyTargetDays = signal<string[]>([]);
  readonly isCopying = signal(false);

  ngOnInit(): void {
    this.loadDoctorDuration();
  }

  openDialog(): void {
    this.loadMySchedule();
    this.loadMyHolidays();
    this.showDialog.set(true);
  }

  dayLabel(key: string): string {
    return DAY_LABELS[key] || key;
  }

  // ==========================================
  // DAUER
  // ==========================================
  private loadDoctorDuration(): void {
    this.appointmentService.getAllDoctors().subscribe({
      next: (docs: DoctorInfo[]) => {
        const token = localStorage.getItem('jwt_token');
        if (!token) return;

        const myEmail = JSON.parse(atob(token.split('.')[1])).sub;
        const me = (docs as DoctorWithSlot[]).find(d => d.email === myEmail);
        if (me?.slotDuration) this.selectedDuration.set(me.slotDuration);
      }
    });
  }

  saveDuration(): void {
    this.isSavingDuration.set(true);
    const minutes = this.selectedDuration();

    this.scheduleService.updateSlotDuration(minutes).subscribe({
      next: () => {
        this.isSavingDuration.set(false);
        this.messageService.add({ severity: 'success', summary: 'Erfolg', detail: `Dauer auf ${minutes} Min. geändert!` });
      },
      error: (err: HttpErrorResponse) => {
        this.isSavingDuration.set(false);
        this.messageService.add({ severity: 'error', summary: 'Fehler', detail: err.error?.message || 'Konnte Dauer nicht ändern.' });
      }
    });
  }

  // ==========================================
  // URLAUB
  // ==========================================
  private loadMyHolidays(): void {
    this.holidayService.getMyHolidays().subscribe({
      next: (data: DoctorHoliday[]) => this.myHolidays.set(data)
    });
  }

  blockDay(): void {
    const selected = this.blockedDate();
    const first = Array.isArray(selected) ? selected[0] : selected;

    if (!first) {
      this.messageService.add({ severity: 'warn', summary: 'Achtung', detail: 'Bitte wähle zuerst ein Datum aus!' });
      return;
    }

    const startDate = first;
    const endDate = Array.isArray(selected) && selected[1] ? selected[1] : first;

    const startMs = new Date(startDate).setHours(0, 0, 0, 0);
    const endMs = new Date(endDate).setHours(0, 0, 0, 0);

    const isAlreadyBlocked = this.myHolidays().some(h => {
      const t = new Date(h.holidayDate).setHours(0, 0, 0, 0);
      return t >= startMs && t <= endMs;
    });

    if (isAlreadyBlocked) {
      this.messageService.add({ severity: 'error', summary: 'Fehler', detail: 'Tage sind bereits blockiert!' });
      return;
    }

    const startStr = toIsoDate(startDate);
    const endStr = toIsoDate(endDate);

    this.confirmationService.confirm({
      message: startStr === endStr
        ? `Möchtest du den ${startStr} blockieren?`
        : `Möchtest du den Zeitraum ${startStr} bis ${endStr} blockieren?`,
      header: 'Urlaub eintragen',
      icon: 'pi pi-info-circle',
      acceptLabel: 'Ja, blockieren',
      rejectLabel: 'Abbrechen',
      acceptButtonStyleClass: 'p-button-warning p-2 px-4 rounded-md',
      rejectButtonStyleClass: 'p-button-text p-2 px-4 rounded-md',
      accept: () => {
        this.isSavingHoliday.set(true);
        this.holidayService.addHolidayRange(startStr, endStr).subscribe({
          next: () => {
            this.isSavingHoliday.set(false);
            this.messageService.add({ severity: 'success', summary: 'Erfolg', detail: 'Urlaub eingetragen!' });
            this.blockedDate.set(null);
            this.loadMyHolidays();
            this.settingsChanged.emit();
          },
          error: (err: HttpErrorResponse) => {
            this.isSavingHoliday.set(false);
            this.messageService.add({ severity: 'error', summary: 'Fehler', detail: err.error?.message || 'Fehler beim Speichern.' });
          }
        });
      }
    });
  }

  deleteHoliday(holidayIds: number[]): void {
    this.confirmationService.confirm({
      message: 'Möchtest du diesen Urlaubszeitraum löschen?',
      header: 'Urlaub löschen',
      icon: 'pi pi-trash',
      acceptLabel: 'Ja, Löschen',
      rejectLabel: 'Abbrechen',
      acceptButtonStyleClass: 'p-button-danger p-2 px-4 rounded-md',
      rejectButtonStyleClass: 'p-button-text p-2 px-4 rounded-md',
      accept: () => {
        forkJoin(holidayIds.map(id => this.holidayService.deleteHoliday(id))).subscribe({
          next: () => {
            this.messageService.add({ severity: 'success', summary: 'Erfolg', detail: 'Urlaubszeitraum gelöscht!' });
            this.loadMyHolidays();
            this.settingsChanged.emit();
          },
          error: (err: HttpErrorResponse) => {
            this.messageService.add({ severity: 'error', summary: 'Fehler', detail: err.error?.message || 'Löschen fehlgeschlagen.' });
            this.loadMyHolidays();
          }
        });
      }
    });
  }

  // ==========================================
  // SCHICHTEN
  // ==========================================
  private loadMySchedule(): void {
    this.scheduleService.getMySchedule().subscribe({
      next: (data: DoctorSchedule[]) => this.mySchedule.set(data),
      error: (err: HttpErrorResponse) => console.error('Fehler beim Laden des Plans', err)
    });
  }

  private hasOverlap(dayOfWeek: string, startTime: string, endTime: string, excludeId: number | null): boolean {
    const newStart = toMinutes(startTime);
    const newEnd = toMinutes(endTime);

    return this.mySchedule()
      .filter(s => s.dayOfWeek === dayOfWeek && s.id !== excludeId)
      .some(s => {
        const existingStart = toMinutes(s.startTime.substring(0, 5));
        const existingEnd = toMinutes(s.endTime.substring(0, 5));
        return newStart < existingEnd && newEnd > existingStart;
      });
  }

  saveSchedule(): void {
    if (this.scheduleForm.invalid) return;

    const { dayOfWeek, startTime, endTime } = this.scheduleForm.value;
    const editingId = this.editingScheduleId();

    if (startTime >= endTime) {
      this.messageService.add({ severity: 'warn', summary: 'Ungültige Zeit', detail: 'Die Startzeit muss vor der Endzeit liegen.' });
      return;
    }

    if (this.hasOverlap(dayOfWeek, startTime, endTime, editingId)) {
      this.messageService.add({ severity: 'warn', summary: 'Überschneidung', detail: 'Diese Zeit überschneidet sich mit einer bestehenden Schicht an diesem Tag.' });
      return;
    }

    const requestData = { dayOfWeek, startTime, endTime };
    this.isSavingSchedule.set(true);

    // Bearbeiten, wenn eine ID vorhanden ist, sonst neu anlegen
    const request$ = editingId !== null
      ? this.scheduleService.updateSchedule(editingId, requestData)
      : this.scheduleService.saveSchedule(requestData);

    request$.subscribe({
      next: () => {
        this.isSavingSchedule.set(false);
        this.editingScheduleId.set(null);
        this.messageService.add({ severity: 'success', summary: 'Erfolg', detail: 'Arbeitszeit gespeichert!' });
        this.scheduleForm.reset();
        this.loadMySchedule();
      },
      error: (err: HttpErrorResponse) => {
        this.isSavingSchedule.set(false);
        this.messageService.add({ severity: 'error', summary: 'Fehler', detail: err.error?.message || 'Fehler beim Speichern.' });
      }
    });
  }

  editSchedule(schedule: DoctorSchedule): void {
    this.editingScheduleId.set(schedule.id);
    this.scheduleForm.patchValue({
      dayOfWeek: schedule.dayOfWeek,
      startTime: schedule.startTime.substring(0, 5),
      endTime: schedule.endTime.substring(0, 5)
    });
  }

  cancelEdit(): void {
    this.editingScheduleId.set(null);
    this.scheduleForm.reset();
  }

  preselectDay(day: string): void {
    this.scheduleForm.patchValue({ dayOfWeek: day });
  }

  deleteSchedule(scheduleId: number): void {
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
            this.messageService.add({ severity: 'success', summary: 'Erfolg', detail: 'Arbeitszeit gelöscht!' });
            if (this.editingScheduleId() === scheduleId) this.cancelEdit();
            this.loadMySchedule();
          }
        });
      }
    });
  }

  // ==========================================
  // AUF ANDERE TAGE KOPIEREN
  // ==========================================
  toggleCopyPanel(day: string): void {
    if (this.copySourceDay() === day) {
      this.closeCopyPanel();
      return;
    }
    this.copySourceDay.set(day);
    this.copyTargetDays.set([]);
  }

  closeCopyPanel(): void {
    this.copySourceDay.set(null);
    this.copyTargetDays.set([]);
  }

  toggleCopyTarget(day: string): void {
    if (day === this.copySourceDay()) return;
    this.copyTargetDays.update(days =>
      days.includes(day) ? days.filter(d => d !== day) : [...days, day]
    );
  }

  applyCopy(): void {
    const source = this.copySourceDay();
    const targets = this.copyTargetDays();
    if (!source || targets.length === 0) return;

    const sourceShifts = this.mySchedule().filter(s => s.dayOfWeek === source);
    if (sourceShifts.length === 0) return;

    const validTargets = targets.filter(day =>
      sourceShifts.every(shift => !this.hasOverlap(day, shift.startTime.substring(0, 5), shift.endTime.substring(0, 5), null))
    );
    const skipped = targets.length - validTargets.length;

    if (validTargets.length === 0) {
      this.messageService.add({ severity: 'warn', summary: 'Nicht möglich', detail: 'Alle Zieltage haben bereits überschneidende Schichten.' });
      return;
    }

    this.isCopying.set(true);

    const requests = validTargets.flatMap(day =>
      sourceShifts.map(shift =>
        this.scheduleService
          .saveSchedule({
            dayOfWeek: day,
            startTime: shift.startTime.substring(0, 5),
            endTime: shift.endTime.substring(0, 5)
          })
          .pipe(catchError(() => of(null)))   // ein Fehler soll die anderen nicht abbrechen
      )
    );

    forkJoin(requests).subscribe(() => {
      this.isCopying.set(false);
      this.closeCopyPanel();
      this.messageService.add({
        severity: 'success',
        summary: 'Erfolg',
        detail: skipped > 0
          ? `Kopiert! ${skipped} Tag(e) übersprungen wegen Überschneidung.`
          : 'Arbeitszeiten kopiert!'
      });
      this.loadMySchedule();
    });
  }
}