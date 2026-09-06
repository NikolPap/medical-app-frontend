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
      'Authorization': 'Bearer ${token}'
    });

    return this.http.get<Appointment[]>(`${this.API_URL}/me`, { headers });
  }
}
