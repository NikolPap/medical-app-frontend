import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { DoctorSchedule, ApiResponse } from '../models/appointment.model';

@Injectable({
  providedIn: 'root'
})
export class ScheduleService {

  private readonly API_URL = 'http://localhost:8080/api/schedules';

  constructor(private http: HttpClient) { }

  saveSchedule(scheduleData: unknown): Observable<ApiResponse> {
    return this.http.post<ApiResponse>(this.API_URL, scheduleData);
  }

  getMySchedule(): Observable<DoctorSchedule[]> { 
    return this.http.get<DoctorSchedule[]>(`${this.API_URL}/me`);
  }

  deleteSchedule(id: number): Observable<ApiResponse> {
    return this.http.delete<ApiResponse>(`${this.API_URL}/${id}`);
  }

  updateSlotDuration(minutes: number): Observable<ApiResponse> {
    return this.http.put<ApiResponse>(`${this.API_URL}/duration?minutes=${minutes}`, {});
  }
}