import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class HolidayService {

  private readonly API_URL = 'http://localhost:8080/api/holidays';

  constructor(private http: HttpClient) { }

  // 1. Urlaub eintragen
  addHoliday(date: string): Observable<any> {
    const token = localStorage.getItem('jwt_token');
    const headers = new HttpHeaders({ 'Authorization': `Bearer ${token}` });
    return this.http.post(`${this.API_URL}?date=${date}`, {}, { headers });
  }

  // 2. Alle Urlaube abrufen
  getMyHolidays(): Observable<any[]> {
    const token = localStorage.getItem('jwt_token');
    const headers = new HttpHeaders({ 'Authorization': `Bearer ${token}` });
    return this.http.get<any[]>(`${this.API_URL}/me`, { headers });
  }

  // 3. Urlaub löschen
  deleteHoliday(id: number): Observable<any> {
    const token = localStorage.getItem('jwt_token');
    const headers = new HttpHeaders({ 'Authorization': `Bearer ${token}` });
    return this.http.delete(`${this.API_URL}/${id}`, { headers });
  }

  // NEU: Akzeptiert Start- und Enddatum
  addHolidayRange(startDate: string, endDate: string): Observable<any> {
    const token = localStorage.getItem('jwt_token');
    const headers = new HttpHeaders({ 'Authorization': `Bearer ${token}` });
    return this.http.post(`${this.API_URL}?startDate=${startDate}&endDate=${endDate}`, {}, { headers });
  }
}