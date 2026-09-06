import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';

// ACHTUNG: Passe diesen Pfad an dein System an, falls er rot ist!
import { AppointmentService } from '../../core/services/appointment';
import { Appointment } from '../../core/models/appointment.model';

// PRIMENG IMPORTS FÜR EIN SCHÖNES UI
import { TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag'; 
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';

@Component({
  selector: 'app-dashboard',
  standalone: true, // WICHTIG in Angular 17+
  imports: [CommonModule, TableModule, TagModule, ButtonModule, CardModule], 
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.scss'
})
export class DashboardComponent implements OnInit {

  // Strikte Typisierung! Keine 'any' mehr.
  appointments: Appointment[] = [];
  isLoading: boolean = true; // Für einen Lade-Spinner

  // Den "Kurier" in den Konstruktor laden
  constructor(private appointmentService: AppointmentService) {}

  // Diese Methode wird automatisch aufgerufen, sobald das Dashboard geladen wird!
  ngOnInit(): void {
    this.loadAppointments();
  }

  // Hier holen wir die Daten aus dem Backend
  loadAppointments() {
    this.appointmentService.getMyAppointments().subscribe({
      next: (data: Appointment[]) => {
        console.log("Termine erfolgreich geladen:", data);
        this.appointments = data;
        this.isLoading = false;
      },
      error: (err) => {
        console.error("Fehler beim Laden der Termine:", err);
        this.isLoading = false;
      }
    });
  }

  // Hilfsmethode für die Farbe der PrimeNG Tags (Badges)
  getSeverity(status: string): "success" | "info" | "warning" | "danger" | "secondary" | "contrast" | undefined {
    switch (status) {
        case 'CONFIRMED': return 'success'; // Grün
        case 'PENDING': return 'warning';   // Orange
        case 'CANCELLED': return 'danger';  // Rot
        default: return 'info';
    }
  }
}