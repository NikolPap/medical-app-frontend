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

  // Loading States für die Buttons
  isSavingDuration: boolean = false;
  isSavingHoliday: boolean = false;
  isSavingSchedule: boolean = false;

  // Dauer-Settings
  durationOptions = [
    { label: '10 Minuten', value: 10 }, { label: '15 Minuten', value: 15 },
    { label: '20 Minuten', value: 20 }, { label: '30 Minuten', value: 30 },
    { label: '45 Minuten', value: 45 }, { label: '60 Minuten', value: 60 }
  ];
  selectedDuration: number = 30;

  // Urlaub-Settings
  blockedDate: Date | Date[] | null = null;
  myHolidays: DoctorHoliday[] = [];
  groupedHolidays: { startDate: string, endDate: string, ids: number[] }[] = [];

  // Schichten-Settings
  scheduleForm: FormGroup;
  mySchedule: DoctorSchedule[] = [];
  editingScheduleId: number | null = null;

  // NEU: Die Struktur für das Weekly Grid (MO - SO)
  weeklyGrid = [
    { id: 'MONDAY', label: 'MO', shifts: [] as DoctorSchedule[] },
    { id: 'TUESDAY', label: 'DI', shifts: [] as DoctorSchedule[] },
    { id: 'WEDNESDAY', label: 'MI', shifts: [] as DoctorSchedule[] },
    { id: 'THURSDAY', label: 'DO', shifts: [] as DoctorSchedule[] },
    { id: 'FRIDAY', label: 'FR', shifts: [] as DoctorSchedule[] },
    { id: 'SATURDAY', label: 'SA', shifts: [] as DoctorSchedule[] },
    { id: 'SUNDAY', label: 'SO', shifts: [] as DoctorSchedule[] }
  ];

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

  // --- DAUER (DURATION) ---
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
        this.messageService.add({severity: 'success', summary: 'Erfolg', detail: `Dauer auf ${this.selectedDuration} Min. geändert!`});
        this.isSavingDuration = false;
      },
      error: (err: any) => {
        this.messageService.add({severity: 'error', summary: 'Fehler', detail: err.error?.error || 'Konnte Dauer nicht ändern.'});
        this.isSavingDuration = false;
      }
    });
  }

  // --- URLAUB (HOLIDAYS) ---
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

  blockDay() {
    if (!this.blockedDate) return;

    let startDate: Date;
    let endDate: Date;

    if (Array.isArray(this.blockedDate)) {
      if (!this.blockedDate[0]) return;
      startDate = this.blockedDate[0];
      endDate = this.blockedDate[1] ? this.blockedDate[1] : this.blockedDate[0]; 
    } else {
      startDate = this.blockedDate;
      endDate = this.blockedDate;
    }

    const isAlreadyBlocked = this.myHolidays.some(h => {
      const hDate = new Date(h.holidayDate);
      hDate.setHours(0,0,0,0);
      const sDate = new Date(startDate);
      sDate.setHours(0,0,0,0);
      const eDate = new Date(endDate);
      eDate.setHours(0,0,0,0);
      return hDate.getTime() >= sDate.getTime() && hDate.getTime() <= eDate.getTime();
    });

    if (isAlreadyBlocked) {
      this.messageService.add({severity: 'error', summary: 'Fehler', detail: 'Tage sind bereits blockiert!'});
      return;
    }

    const format = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    const startStr = format(startDate);
    const endStr = format(endDate);

    this.isSavingHoliday = true;
    this.holidayService.addHolidayRange(startStr, endStr).subscribe({
      next: () => {
        this.messageService.add({severity: 'success', summary: 'Erfolg', detail: 'Urlaub eingetragen!'});
        this.blockedDate = null; 
        this.loadMyHolidays(); 
        this.settingsChanged.emit(); 
        this.isSavingHoliday = false;
      },
      error: (err: any) => {
        this.messageService.add({severity: 'error', summary: 'Fehler', detail: err.error?.error || 'Fehler beim Speichern.'});
        this.isSavingHoliday = false;
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
                this.messageService.add({severity: 'success', summary: 'Erfolg', detail: 'Urlaubszeitraum gelöscht!'});
                this.loadMyHolidays(); 
                this.settingsChanged.emit(); 
              }
            }
          });
        });
      }
    });
  }

  // --- SCHICHTEN (SCHEDULE) ---
  loadMySchedule() {
    this.scheduleService.getMySchedule().subscribe({
      next: (data: DoctorSchedule[]) => {
        this.mySchedule = data;
        
        // Weekly Grid leeren und neu füllen
        this.weeklyGrid.forEach(day => day.shifts = []);
        
        data.forEach(shift => {
          const dayConfig = this.weeklyGrid.find(d => d.id === shift.dayOfWeek);
          if (dayConfig) {
            dayConfig.shifts.push(shift);
          }
        });

        // Schichten innerhalb eines Tages nach Startzeit sortieren
        this.weeklyGrid.forEach(day => {
          day.shifts.sort((a, b) => a.startTime.localeCompare(b.startTime));
        });
      },
      error: (err) => console.error("Fehler beim Laden des Plans", err)
    });
  }

  saveSchedule() {
    if (this.scheduleForm.invalid) return;

    let start = this.scheduleForm.value.startTime; 
    let end = this.scheduleForm.value.endTime;
    const dayOfWeek = this.scheduleForm.value.dayOfWeek;

    // Falls es ein Date-Objekt ist (vom PrimeNG Calendar), extrahieren wir "HH:mm"
    if (typeof start !== 'string') {
      start = start.toTimeString().split(' ')[0].substring(0, 5);
      end = end.toTimeString().split(' ')[0].substring(0, 5);
    }

    // 1. VALIDIERUNG: Endzeit muss nach Startzeit liegen!
    if (start >= end) {
      this.messageService.add({severity: 'error', summary: 'Logikfehler', detail: 'Die Startzeit muss VOR der Endzeit liegen.'});
      return;
    }

    // 2. VALIDIERUNG: Überschneidungs-Check (Overlap)
    const existingShifts = this.mySchedule.filter(s => s.dayOfWeek === dayOfWeek && s.id !== this.editingScheduleId);
    for (let s of existingShifts) {
      const sStart = s.startTime.substring(0, 5);
      const sEnd = s.endTime.substring(0, 5);
      // Wenn Startzeit vor Ende der anderen UND Endzeit nach Start der anderen liegt -> OVERLAP!
      if (start < sEnd && end > sStart) {
        this.messageService.add({severity: 'error', summary: 'Überschneidung', detail: 'Diese Schicht überschneidet sich mit einer bestehenden!'});
        return;
      }
    }

    const requestData = { dayOfWeek, startTime: start, endTime: end };
    this.isSavingSchedule = true;

    if (this.editingScheduleId !== null) {
      this.scheduleService.deleteSchedule(this.editingScheduleId).subscribe({
        next: () => {
          this.sendSaveRequest(requestData);
        }
      });
    } else {
      this.sendSaveRequest(requestData);
    }
  }

  private sendSaveRequest(requestData: any) {
    this.scheduleService.saveSchedule(requestData).subscribe({
      next: () => {
        this.messageService.add({severity: 'success', summary: 'Erfolg', detail: 'Arbeitszeit gespeichert!'});
        this.cancelEdit(); // Reset Formular & Edit Mode
        this.loadMySchedule(); 
        this.isSavingSchedule = false;
      },
      error: (err: any) => {
        this.messageService.add({severity: 'error', summary: 'Fehler', detail: err.error?.error || 'Fehler beim Speichern.'});
        this.isSavingSchedule = false;
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

  // NEU: Bearbeiten abbrechen
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
            this.messageService.add({severity: 'success', summary: 'Erfolg', detail: 'Arbeitszeit gelöscht!'});
            this.loadMySchedule(); 
          }
        });
      }
    });
  }

  // Dummy-Methode für dein UI "Kopieren" Button
  copyToOtherDays() {
    this.messageService.add({severity: 'info', summary: 'Hinweis', detail: 'Feature folgt in Kürze!'});
  }
}