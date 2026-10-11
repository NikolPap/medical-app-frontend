import { Component, OnInit, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { Observable, finalize } from 'rxjs';
import { ConfirmationService, MessageService } from 'primeng/api';
import { ButtonModule } from 'primeng/button';
import { AvatarModule } from 'primeng/avatar';

import { AdminService } from '../../core/services/admin';
import { ApiResponse, PendingDoctor } from '../../core/models/appointment.model';
import { InitialPipe } from '../../core/pipes/appointment-status-pipe';
import { getTokenPayload } from '../../core/utils/jwt';

@Component({
  selector: 'app-admin',
  standalone: true,
  imports: [ButtonModule, AvatarModule, InitialPipe],
  templateUrl: './admin.html'
})
export class AdminComponent implements OnInit {
  private readonly adminService = inject(AdminService);
  private readonly messageService = inject(MessageService);
  private readonly confirmationService = inject(ConfirmationService);
  private readonly router = inject(Router);

  readonly doctors = signal<PendingDoctor[]>([]);
  readonly isLoading = signal(true);
  readonly processingId = signal<number | null>(null);

  readonly adminEmail = getTokenPayload()?.sub ?? '';

  ngOnInit(): void {
    this.loadPendingDoctors();
  }

  loadPendingDoctors(): void {
    this.isLoading.set(true);
    this.adminService.getPendingDoctors()
      .pipe(finalize(() => this.isLoading.set(false)))
      .subscribe({
        next: (data) => this.doctors.set(data),
        error: (err) => this.messageService.add({
          severity: 'error',
          summary: 'Fehler',
          detail: err.error?.message || 'Anfragen konnten nicht geladen werden.'
        })
      });
  }

  approve(doctor: PendingDoctor): void {
    this.confirmationService.confirm({
      header: 'Arzt freischalten',
      message: `Möchtest du Dr. ${doctor.firstName} ${doctor.lastName} freischalten?`,
      icon: 'pi pi-check-circle',
      acceptLabel: 'Ja, freischalten',
      rejectLabel: 'Abbrechen',
      acceptButtonStyleClass: 'p-button-success p-2 px-4 rounded-md',
      rejectButtonStyleClass: 'p-button-text p-2 px-4 rounded-md',
      accept: () => this.process(doctor, this.adminService.approveDoctor(doctor.id), 'freigeschaltet')
    });
  }

  reject(doctor: PendingDoctor): void {
    this.confirmationService.confirm({
      header: 'Arzt ablehnen',
      message: `Möchtest du die Anfrage von ${doctor.firstName} ${doctor.lastName} wirklich ablehnen?`,
      icon: 'pi pi-exclamation-triangle',
      acceptLabel: 'Ja, ablehnen',
      rejectLabel: 'Abbrechen',
      acceptButtonStyleClass: 'p-button-danger p-2 px-4 rounded-md',
      rejectButtonStyleClass: 'p-button-text p-2 px-4 rounded-md',
      accept: () => this.process(doctor, this.adminService.rejectDoctor(doctor.id), 'abgelehnt')
    });
  }

  private process(doctor: PendingDoctor, request: Observable<ApiResponse>, resultLabel: string): void {
    this.processingId.set(doctor.id);

    request
      .pipe(finalize(() => this.processingId.set(null)))
      .subscribe({
        next: () => {
          this.doctors.update(list => list.filter(d => d.id !== doctor.id));
          this.messageService.add({
            severity: 'success',
            summary: 'Erfolg',
            detail: `${doctor.firstName} ${doctor.lastName} wurde ${resultLabel}.`
          });
        },
        error: (err) => this.messageService.add({
          severity: 'error',
          summary: 'Fehler',
          detail: err.error?.message || 'Aktion nicht möglich.'
        })
      });
  }

  logout(): void {
    localStorage.removeItem('jwt_token');
    this.router.navigate(['/login']);
  }
}