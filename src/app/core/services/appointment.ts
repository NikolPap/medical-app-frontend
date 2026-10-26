import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Appointment } from '../models/appointment.model';
import { ApiResponse } from '../models/appointment.model';
import { DoctorInfo } from '../models/appointment.model';


@Injectable({
  providedIn: 'root',
})
export class AppointmentService {
  private readonly API_URL = 'http://localhost:8080/api/appointments';

private readonly http = inject(HttpClient);

  // 1. Termine holen (Token wird jetzt automatisch vom Interceptor hinzugefügt!)
  getMyAppointments(): Observable<Appointment[]> {
    return this.http.get<Appointment[]>(`${this.API_URL}/me`);
  }

  // 2. Status ändern
  updateAppointmentStatus(id: number, newStatus: string): Observable<ApiResponse> {
    return this.http.put<ApiResponse>(`${this.API_URL}/${id}/status?status=${newStatus}`, {});
  }

  // 3. Alle Ärzte holen
  getAllDoctors(): Observable<DoctorInfo[]> {
    return this.http.get<DoctorInfo[]>('http://localhost:8080/api/auth/doctors');
  }

  // 4. Termin buchen
  createAppointment(appointmentData: unknown): Observable<ApiResponse> {
    return this.http.post<ApiResponse>(this.API_URL, appointmentData);
  }

  // 5. Freie Slots (Darf auch ohne Token klappen, aber mit Token schadet es auch nicht)
  getAvailableSlots(doctorId: number, date: string): Observable<string[]> {
    return this.http.get<string[]>(`${this.API_URL}/available-slots?doctorId=${doctorId}&date=${date}`);
  }

  // (Optional: Kannst du löschen, wenn wir jetzt die Holiday-Tabelle nutzen!)
  blockEntireDay(date: string): Observable<ApiResponse> {
    return this.http.post<ApiResponse>(`${this.API_URL}/block-day?date=${date}`, {});
  }

  rescheduleAppointment(id: number, data: { appointmentDate: string; appointmentTime: string }): Observable<Appointment> {
  return this.http.put<Appointment>(`${this.API_URL}/${id}/reschedule`, data);
}
}