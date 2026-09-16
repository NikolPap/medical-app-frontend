import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { DoctorSchedule } from '../models/appointment.model';
import { ApiResponse } from '../models/appointment.model';

@Injectable({
  providedIn: 'root'
})
export class ScheduleService {

  private readonly API_URL = 'http://localhost:8080/api/schedules';

  constructor(private http: HttpClient) { }

  // 1. Speichert eine neue Arbeitszeit
   saveSchedule(scheduleData: unknown): Observable<ApiResponse> {
    const token = localStorage.getItem('jwt_token');
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`
    });
    return this.http.post<ApiResponse>(this.API_URL, scheduleData, { headers });
  }

  // 2. Holt den Wochenplan des Arztes
  getMySchedule(): Observable<DoctorSchedule[]> { 
    const token = localStorage.getItem('jwt_token');
    const headers = new HttpHeaders({ 'Authorization': `Bearer ${token}` });
    return this.http.get<DoctorSchedule[]>(`${this.API_URL}/me`, { headers });
  }

  // 3. Löscht eine Arbeitszeit (Schicht)
  deleteSchedule(id: number): Observable<ApiResponse> {
    const token = localStorage.getItem('jwt_token');
    const headers = new HttpHeaders({ 'Authorization': `Bearer ${token}` });

    return this.http.delete<ApiResponse>(`${this.API_URL}/${id}`, { headers });
  }

  // 4. Ändert die Dauer eines Termins für den Arzt (z.B. 15, 30, 45 Min)
  updateSlotDuration(minutes: number): Observable<ApiResponse>{
    const token = localStorage.getItem('jwt_token');
    const headers = new HttpHeaders({ 'Authorization': `Bearer ${token}` });
    
    // Der leere Body {} ist nötig, weil PUT normalerweise Daten sendet, wir aber nur Query-Parameter (?minutes=...) nutzen
return this.http.put<ApiResponse>(`${this.API_URL}/duration?minutes=${minutes}`, {}, { headers });
  }


}