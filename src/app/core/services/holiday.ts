import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { DoctorHoliday, ApiResponse } from '../models/appointment.model';

@Injectable({
  providedIn: 'root'
})
export class HolidayService {

  private readonly API_URL = 'http://localhost:8080/api/holidays';

 private readonly http = inject(HttpClient);

  addHoliday(date: string): Observable<ApiResponse> {
    return this.http.post<ApiResponse>(`${this.API_URL}?date=${date}`, {});
  }

  getMyHolidays(): Observable<DoctorHoliday[]> { 
    return this.http.get<DoctorHoliday[]>(`${this.API_URL}/me`);
  }

  deleteHoliday(id: number): Observable<ApiResponse> {
    return this.http.delete<ApiResponse>(`${this.API_URL}/${id}`);
  }

  addHolidayRange(startDate: string, endDate: string): Observable<ApiResponse> {
    return this.http.post<ApiResponse>(`${this.API_URL}?startDate=${startDate}&endDate=${endDate}`, {});
  }
}