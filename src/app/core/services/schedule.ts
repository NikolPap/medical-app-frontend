import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class ScheduleService {

  private readonly API_URL = 'http://localhost:8080/api/schedules';

  constructor(private http: HttpClient) { }

  // 1. Speichert eine neue Arbeitszeit
  saveSchedule(scheduleData: any): Observable<any> {
    const token = localStorage.getItem('jwt_token');
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`
    });
    return this.http.post(this.API_URL, scheduleData, { headers });
  }

  // 2. Holt den Wochenplan des Arztes
  getMySchedule(): Observable<any[]> {
    const token = localStorage.getItem('jwt_token');
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`
    });
    return this.http.get<any[]>(`${this.API_URL}/me`, { headers });
  }

  // 3. Löscht eine Arbeitszeit (Schicht)
  deleteSchedule(id: number): Observable<any> {
    const token = localStorage.getItem('jwt_token');
    const headers = new HttpHeaders({ 'Authorization': `Bearer ${token}` });
    
    return this.http.delete(`${this.API_URL}/${id}`, { headers });
  }
}