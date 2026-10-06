import { Component, EventEmitter, OnInit, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { AppointmentService } from '../../../../core/services/appointment';
import { ScheduleService } from '../../../../core/services/schedule';
import { HolidayService } from '../../../../core/services/holiday';
import { MessageService, ConfirmationService } from 'primeng/api';
import { DoctorSchedule } from '../../../../core/models/appointment.model';
import { DoctorHoliday } from '../../../../core/models/appointment.model';

import { DialogModule } from 'primeng/dialog';
import { DropdownModule } from 'primeng/dropdown';
import { CalendarModule } from 'primeng/calendar';
import { ButtonModule } from 'primeng/button';
import { TooltipModule } from 'primeng/tooltip';
import { ConfirmDialogModule } from 'primeng/confirmdialog';

const DAY_ORDER: { [key: string]: number } = {
  MONDAY: 1, TUESDAY: 2, WEDNESDAY: 3, THURSDAY: 4, FRIDAY: 5, SATURDAY: 6, SUNDAY: 7
};

const DAY_LABELS: { [key: string]: string } = {
  MONDAY: 'Mo', TUESDAY: 'Di', WEDNESDAY: 'Mi', THURSDAY: 'Do', FRIDAY: 'Fr', SATURDAY: 'Sa', SUNDAY: 'So'
};

@Component({
  selector: 'app-doctor-settings',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule, DialogModule, DropdownModule, CalendarModule, ButtonModule, TooltipModule, ConfirmDialogModule],
  providers: [ConfirmationService],
  templateUrl: './doctor-settings.html'
})
export class DoctorSettingsComponent implements OnInit {

  @Output() settingsChanged = new EventEmitter<void>();

  showDialog: boolean = false;
  minDate: Date = new Date();

  // --- DAUER ---
  durationOptions = [
    { label: '10 Minuten', value: 10 }, { label: '15 Minuten', value: 15 },
    { label: '20 Minuten', value: 20 }, { label: '30 Minuten', value: 30 },
    { label: '40 Minuten', value: 40 }, { label: '45 Minuten', value: 45 },
    { label: '60 Minuten', value: 60 }
  ];
  selectedDuration: number = 30;
  isSavingDuration: boolean = false;

  // --- URLAUB ---
  blockedDate: Date | Date[] | null = null;
  myHolidays: DoctorHoliday[] = [];
  groupedHolidays: { startDate: string, endDate: string, ids: number[] }[] = [];
  isSavingHoliday: boolean = false;

  // --- SCHICHTEN ---
  scheduleForm: FormGroup;
  mySchedule: DoctorSchedule[] = [];
  groupedSchedule: { dayOfWeek: string, shifts: DoctorSchedule[] }[] = [];
  editingScheduleId: number | null = null;
  isSavingSchedule: boolean = false;

  // --- WEEKLY GRID (abgeleitet aus mySchedule) ---
  readonly weekDayKeys = ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY', 'SUNDAY'];

  get weekGrid(): { key: string, label: string, shifts: DoctorSchedule[] }[] {
    return this.weekDayKeys.map(key => ({
      key,
      label: DAY_LABELS[key],
      shifts: this.mySchedule
        .filter(s => s.dayOfWeek === key)
        .sort((a, b) => (a.startTime || '').localeCompare(b.startTime || ''))
    }));
  }

  // --- KOPIEREN AUF ANDERE TAGE ---
  showCopyPanel: boolean = false;
  copySourceDay: string | null = null;
  copyTargetDays: string[] = [];
  isCopying: boolean = false;

  constructor(
    private fb: FormBuilder,
    private appointmentService: AppointmentService,
    private scheduleService: ScheduleService,
    private holidayService: HolidayService,
    private messageService: MessageService,
    private confirmationService: ConfirmationService
  ) {
    this.scheduleForm = this.fb.group({
      dayOfWeek: ['', Validators.required],
      startTime: [null, Validators.required],
      endTime: [null, Validators.required]
    });
  }

  ngOnInit() {
    this.loadDoctorDuration();
  }

  openDialog() {
    this.loadMySchedule();
    this.loadMyHolidays();
    this.showDialog = true;
  }

  // ==========================================
  // DAUER
  // ==========================================
  loadDoctorDuration() {
    this.appointmentService.getAllDoctors().subscribe({
      next: (docs) => {
        const token = localStorage.getItem('jwt_token');
        if (token) {
          const myEmail = JSON.parse(atob(token.split('.')[1])).sub;
          const me = docs.find((d: any) => d.email === myEmail);
          if (me && me.slotDuration) {
            this.selectedDuration = me.slotDuration;
          }
        }
      }
    });
  }

  saveDuration() {
    this.isSavingDuration = true;
    this.scheduleService.updateSlotDuration(this.selectedDuration).subscribe({
      next: () => {
        this.isSavingDuration = false;
        this.messageService.add({ severity: 'success', summary: 'Erfolg', detail: `Dauer auf ${this.selectedDuration} Min. geändert!` });
      },
      error: (err: { error: { message: string } }) => {
        this.isSavingDuration = false;
        this.messageService.add({ severity: 'error', summary: 'Fehler', detail: err.error?.message || 'Konnte Dauer nicht ändern.' });
      }
    });
  }

  // ==========================================
  // URLAUB
  // ==========================================
  loadMyHolidays() {
    this.holidayService.getMyHolidays().subscribe({
      next: (data: DoctorHoliday[]) => {
        this.myHolidays = data;
        this.groupHolidays(data);
      }
    });
  }

  groupHolidays(holidays: DoctorHoliday[]) {
    if (!holidays || holidays.length === 0) {
      this.groupedHolidays = [];
      return;
    }
    const sorted = [...holidays].sort((a, b) => new Date(a.holidayDate).getTime() - new Date(b.holidayDate).getTime());
    const grouped: { startDate: string, endDate: string, ids: number[] }[] = [];
    let currentGroup = { startDate: sorted[0].holidayDate, endDate: sorted[0].holidayDate, ids: [sorted[0].id] };

    for (let i = 1; i < sorted.length; i++) {
      const current = sorted[i];
      const previousDate = new Date(sorted[i - 1].holidayDate);
      const currentDate = new Date(current.holidayDate);
      const diffDays = Math.ceil(Math.abs(currentDate.getTime() - previousDate.getTime()) / (1000 * 60 * 60 * 24));

      if (diffDays === 1) {
        currentGroup.endDate = current.holidayDate;
        currentGroup.ids.push(current.id);
      } else {
        grouped.push(currentGroup);
        currentGroup = { startDate: current.holidayDate, endDate: current.holidayDate, ids: [current.id] };
      }
    }
    grouped.push(currentGroup);
    this.groupedHolidays = grouped;
  }

  get disabledHolidayDates(): Date[] {
    return this.myHolidays.map(h => new Date(h.holidayDate));
  }

  blockDay() {
    if (!this.blockedDate) {
      this.messageService.add({ severity: 'warn', summary: 'Achtung', detail: 'Bitte wähle zuerst ein Datum aus!' });
      return;
    }

    let startDate: Date;
    let endDate: Date;

    if (Array.isArray(this.blockedDate)) {
      if (!this.blockedDate[0]) {
        this.messageService.add({ severity: 'warn', summary: 'Achtung', detail: 'Bitte wähle zuerst ein Datum aus!' });
        return;
      }
      startDate = this.blockedDate[0];
      endDate = this.blockedDate[1] ? this.blockedDate[1] : this.blockedDate[0];
    } else {
      startDate = this.blockedDate;
      endDate = this.blockedDate;
    }

    const isAlreadyBlocked = this.myHolidays.some(h => {
      const hDate = new Date(h.holidayDate);
      hDate.setHours(0, 0, 0, 0);
      const sDate = new Date(startDate);
      sDate.setHours(0, 0, 0, 0);
      const eDate = new Date(endDate);
      eDate.setHours(0, 0, 0, 0);
      return hDate.getTime() >= sDate.getTime() && hDate.getTime() <= eDate.getTime();
    });

    if (isAlreadyBlocked) {
      this.messageService.add({ severity: 'error', summary: 'Fehler', detail: 'Tage sind bereits blockiert!' });
      return;
    }

    const format = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    const startStr = format(startDate);
    const endStr = format(endDate);

    const message = startStr === endStr
      ? `Möchtest du den ${startStr} blockieren?`
      : `Möchtest du den Zeitraum ${startStr} bis ${endStr} blockieren?`;

    this.confirmationService.confirm({
      message,
      header: 'Urlaub eintragen',
      icon: 'pi pi-info-circle',
      acceptLabel: 'Ja, blockieren',
      rejectLabel: 'Abbrechen',
      acceptButtonStyleClass: 'p-button-warning p-2 px-4 rounded-md',
      rejectButtonStyleClass: 'p-button-text p-2 px-4 rounded-md',
      accept: () => {
        this.isSavingHoliday = true;
        this.holidayService.addHolidayRange(startStr, endStr).subscribe({
          next: () => {
            this.isSavingHoliday = false;
            this.messageService.add({ severity: 'success', summary: 'Erfolg', detail: 'Urlaub eingetragen!' });
            this.blockedDate = null;
            this.loadMyHolidays();
            this.settingsChanged.emit();
          },
          error: (err: { error: { message: string } }) => {
            this.isSavingHoliday = false;
            this.messageService.add({ severity: 'error', summary: 'Fehler', detail: err.error?.message || 'Fehler beim Speichern.' });
          }
        });
      }
    });
  }

  deleteHoliday(holidayIds: number[]) {
    this.confirmationService.confirm({
      message: 'Möchtest du diesen Urlaubszeitraum löschen?',
      header: 'Urlaub löschen',
      icon: 'pi pi-trash',
      acceptLabel: 'Ja, Löschen',
      rejectLabel: 'Abbrechen',
      acceptButtonStyleClass: 'p-button-danger p-2 px-4 rounded-md',
      rejectButtonStyleClass: 'p-button-text p-2 px-4 rounded-md',
      accept: () => {
        let deletedCount = 0;
        holidayIds.forEach(id => {
          this.holidayService.deleteHoliday(id).subscribe({
            next: () => {
              deletedCount++;
              if (deletedCount === holidayIds.length) {
                this.messageService.add({ severity: 'success', summary: 'Erfolg', detail: 'Urlaubszeitraum gelöscht!' });
                this.loadMyHolidays();
                this.settingsChanged.emit();
              }
            }
          });
        });
      }
    });
  }

  // ==========================================
  // SCHICHTEN
  // ==========================================
  loadMySchedule() {
    this.scheduleService.getMySchedule().subscribe({
      next: (data: DoctorSchedule[]) => {
        this.mySchedule = data;
        this.rebuildGroupedSchedule();
      },
      error: (err) => console.error('Fehler beim Laden des Plans', err)
    });
  }

  private rebuildGroupedSchedule() {
    const groupedMap = new Map<string, DoctorSchedule[]>();
    this.mySchedule.forEach((s: DoctorSchedule) => {
      if (!groupedMap.has(s.dayOfWeek)) groupedMap.set(s.dayOfWeek, []);
      groupedMap.get(s.dayOfWeek)?.push(s);
    });

    this.groupedSchedule = Array.from(groupedMap.entries()).map(([day, shifts]) => {
      shifts.sort((a: DoctorSchedule, b: DoctorSchedule) => (a?.startTime || '').localeCompare(b?.startTime || ''));
      return { dayOfWeek: day, shifts };
    }).sort((a, b) => DAY_ORDER[a.dayOfWeek] - DAY_ORDER[b.dayOfWeek]);
  }

  private toMinutes(time: string): number {
    const [h, m] = time.split(':').map(Number);
    return h * 60 + m;
  }

  private hasOverlap(dayOfWeek: string, startTime: string, endTime: string, excludeId: number | null): boolean {
    const newStart = this.toMinutes(startTime);
    const newEnd = this.toMinutes(endTime);

    return this.mySchedule
      .filter(s => s.dayOfWeek === dayOfWeek && s.id !== excludeId)
      .some(s => {
        const existingStart = this.toMinutes(s.startTime.substring(0, 5));
        const existingEnd = this.toMinutes(s.endTime.substring(0, 5));
        return newStart < existingEnd && newEnd > existingStart;
      });
  }

  saveSchedule() {
    if (this.scheduleForm.invalid) return;

    const { dayOfWeek, startTime, endTime } = this.scheduleForm.value;

    if (startTime >= endTime) {
      this.messageService.add({ severity: 'warn', summary: 'Ungültige Zeit', detail: 'Die Startzeit muss vor der Endzeit liegen.' });
      return;
    }

    if (this.hasOverlap(dayOfWeek, startTime, endTime, this.editingScheduleId)) {
      this.messageService.add({ severity: 'warn', summary: 'Überschneidung', detail: 'Diese Zeit überschneidet sich mit einer bestehenden Schicht an diesem Tag.' });
      return;
    }

    const requestData = { dayOfWeek, startTime, endTime };
    this.isSavingSchedule = true;

    if (this.editingScheduleId !== null) {
      this.scheduleService.deleteSchedule(this.editingScheduleId).subscribe({
        next: () => {
          this.editingScheduleId = null;
          this.sendSaveRequest(requestData);
        }
      });
    } else {
      this.sendSaveRequest(requestData);
    }
  }

  private sendSaveRequest(requestData: { dayOfWeek: string, startTime: string, endTime: string }) {
    this.scheduleService.saveSchedule(requestData).subscribe({
      next: () => {
        this.isSavingSchedule = false;
        this.messageService.add({ severity: 'success', summary: 'Erfolg', detail: 'Arbeitszeit gespeichert!' });
        this.scheduleForm.reset();
        this.loadMySchedule();
      },
      error: (err: { error: { message: string } }) => {
        this.isSavingSchedule = false;
        this.messageService.add({ severity: 'error', summary: 'Fehler', detail: err.error?.message || 'Fehler beim Speichern.' });
      }
    });
  }

  editSchedule(schedule: DoctorSchedule) {
    this.editingScheduleId = schedule.id;
    this.scheduleForm.patchValue({
      dayOfWeek: schedule.dayOfWeek,
      startTime: schedule.startTime.substring(0, 5),
      endTime: schedule.endTime.substring(0, 5)
    });
  }

  cancelEdit() {
    this.editingScheduleId = null;
    this.scheduleForm.reset();
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
            this.messageService.add({ severity: 'success', summary: 'Erfolg', detail: 'Arbeitszeit gelöscht!' });
            if (this.editingScheduleId === scheduleId) this.cancelEdit();
            this.loadMySchedule();
          }
        });
      }
    });
  }

  // ==========================================
  // AUF ANDERE TAGE KOPIEREN
  // ==========================================
  toggleCopyPanel(day: string) {
    if (this.showCopyPanel && this.copySourceDay === day) {
      this.showCopyPanel = false;
      this.copySourceDay = null;
      return;
    }
    this.copySourceDay = day;
    this.copyTargetDays = [];
    this.showCopyPanel = true;
  }

  toggleCopyTarget(day: string) {
    if (day === this.copySourceDay) return;
    const idx = this.copyTargetDays.indexOf(day);
    if (idx > -1) this.copyTargetDays.splice(idx, 1);
    else this.copyTargetDays.push(day);
  }

  applyCopy() {
    if (!this.copySourceDay || this.copyTargetDays.length === 0) return;

    const sourceShifts = this.mySchedule.filter(s => s.dayOfWeek === this.copySourceDay);
    if (sourceShifts.length === 0) return;

    const validTargets = this.copyTargetDays.filter(day =>
      sourceShifts.every(shift => !this.hasOverlap(day, shift.startTime.substring(0, 5), shift.endTime.substring(0, 5), null))
    );
    const skipped = this.copyTargetDays.length - validTargets.length;

    if (validTargets.length === 0) {
      this.messageService.add({ severity: 'warn', summary: 'Nicht möglich', detail: 'Alle Zieltage haben bereits überschneidende Schichten.' });
      return;
    }

    this.isCopying = true;
    let remaining = validTargets.length * sourceShifts.length;

    validTargets.forEach(day => {
      sourceShifts.forEach(shift => {
        this.scheduleService.saveSchedule({
          dayOfWeek: day,
          startTime: shift.startTime.substring(0, 5),
          endTime: shift.endTime.substring(0, 5)
        }).subscribe({
          next: () => {
            remaining--;
            if (remaining === 0) this.finishCopy(skipped);
          },
          error: () => {
            remaining--;
            if (remaining === 0) this.finishCopy(skipped);
          }
        });
      });
    });
  }

  private finishCopy(skipped: number) {
    this.isCopying = false;
    this.showCopyPanel = false;
    this.copySourceDay = null;
    this.copyTargetDays = [];
    const msg = skipped > 0
      ? `Kopiert! ${skipped} Tag(e) übersprungen wegen Überschneidung.`
      : 'Arbeitszeiten kopiert!';
    this.messageService.add({ severity: 'success', summary: 'Erfolg', detail: msg });
    this.loadMySchedule();
  }

  dayLabel(key: string): string {
    return DAY_LABELS[key] || key;
  }
}