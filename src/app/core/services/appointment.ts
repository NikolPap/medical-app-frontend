import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Appointment } from '../models/appointment.model';
import { ApiResponse } from '../models/appointment.model';
import { DoctorInfo } from '../models/appointment.model';


@Injectable({
  providedIn: 'root',
})
export class AppointmentService {
  private readonly API_URL = 'http://localhost:8080/api/appointments';

  constructor(private http: HttpClient) {}

  getMyAppointments(): Observable<Appointment[]> {
    const token = localStorage.getItem('jwt_token');
    const headers = new HttpHeaders({ 'Authorization': `Bearer ${token}` });
    return this.http.get<Appointment[]>(`${this.API_URL}/me`, { headers });
  }

  // <ApiResponse> statt <any>
  updateAppointmentStatus(id: number, newStatus: string): Observable<ApiResponse> {
    const token = localStorage.getItem(`jwt_token`);
    const headers = new HttpHeaders({ 'Authorization': `Bearer ${token}` });
    return this.http.put<ApiResponse>(`${this.API_URL}/${id}/status?status=${newStatus}`, {}, { headers });
  }

  // <DoctorInfo[]> statt <any[]>
  getAllDoctors(): Observable<DoctorInfo[]> {
    const token = localStorage.getItem('jwt_token');
    const headers = new HttpHeaders({ 'Authorization': `Bearer ${token}` });
    return this.http.get<DoctorInfo[]>('http://localhost:8080/api/auth/doctors', { headers });
  }

  // <ApiResponse> statt <any> (Beim Input können wir 'unknown' nehmen oder ein RequestDto bauen)
  createAppointment(appointmentData: unknown): Observable<ApiResponse> {
    const token = localStorage.getItem('jwt_token');
    const headers = new HttpHeaders({ 'Authorization': `Bearer ${token}` });
    return this.http.post<ApiResponse>(this.API_URL, appointmentData, { headers });
  }

  getAvailableSlots(doctorId: number, date: string): Observable<string[]> {
    return this.http.get<string[]>(`${this.API_URL}/available-slots?doctorId=${doctorId}&date=${date}`);
  }

  // (Optional: Wenn du blockEntireDay noch benutzt, ansonsten löschen!)
  blockEntireDay(date: string): Observable<ApiResponse> {
    const token = localStorage.getItem('jwt_token');
    const headers = new HttpHeaders({ 'Authorization': `Bearer ${token}` });
    return this.http.post<ApiResponse>(`${this.API_URL}/block-day?date=${date}`, {}, { headers });
  }
}