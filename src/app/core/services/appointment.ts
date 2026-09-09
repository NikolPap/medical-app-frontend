import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Appointment } from '../models/appointment.model';

@Injectable({
  providedIn: 'root',
})
export class AppointmentService {
  private readonly API_URL = 'http://localhost:8080/api/appointments';

  constructor(private http: HttpClient) {}

   // 1. Wir holen unsere Termine aus dem Backend
   getMyAppointments(): Observable<Appointment[]>  {
   // Wir holen uns das VIP-Bändchen (Token) aus dem Browser-Speicher!
    const token = localStorage.getItem('jwt_token');

    // Wir stecken das Token in den Header 
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`
    });

    return this.http.get<Appointment[]>(`${this.API_URL}/me`, { headers });
  }

  // Put-Request: Status ändern (Confirmed oder cancelled)
  updateAppointmentStatus(id: number, newStatus: string): Observable<any> {
    const token = localStorage.getItem(`jwt_token`);
    const headers = new HttpHeaders({
     'Authorization': `Bearer ${token}` 
    });

    //Die URL sieht so aus:  /api/appointments/5/status?status=CONFIRMED
    return this.http.put(`${this.API_URL}/${id}/status?status=${newStatus}`, {}, { headers });
  }

  // Holt alle verfügbaren Ärzte aus dem Backend
  getAllDoctors(): Observable<any[]> {
    const token = localStorage.getItem('jwt_token');
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`
    });
    // ACHTUNG: Die URL muss übereinstimmen!
    return this.http.get<any[]>('http://localhost:8080/api/auth/doctors', { headers });
  }

  // POST-Request: Einen neuen Termin buchen!
  createAppointment(appointmentData: any): Observable<any> {
    const token = localStorage.getItem('jwt_token');
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`
    });
    return this.http.post(this.API_URL, appointmentData, { headers });
  }

    // Holt alle verfügbaren Uhrzeiten (Slots) für einen Arzt an einem Tag
 getAvailableSlots(doctorId: number, date: string): Observable<string[]> {
    // KEIN TOKEN NÖTIG! Das ist jetzt ein öffentlicher Endpoint.
    return this.http.get<string[]>(`${this.API_URL}/available-slots?doctorId=${doctorId}&date=${date}`);
  }

    // 6. Blockiert einen ganzen Tag (Urlaub/Feiertag) für den Arzt
  blockEntireDay(date: string): Observable<any> {
    const token = localStorage.getItem('jwt_token');
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`
    });
    // POST request an /api/appointments/block-day?date=2024-12-25
    return this.http.post(`${this.API_URL}/block-day?date=${date}`, {}, { headers });
  }
  
}
