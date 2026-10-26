import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ApiResponse, PendingDoctor } from '../models/appointment.model';

@Injectable({ providedIn: 'root' })
export class AdminService {
  private readonly API_URL = 'http://localhost:8080/api/admin';

  private readonly http = inject(HttpClient);

  getPendingDoctors(): Observable<PendingDoctor[]> {
    return this.http.get<PendingDoctor[]>(`${this.API_URL}/doctors/pending`);
  }

  approveDoctor(id: number): Observable<ApiResponse> {
    return this.http.put<ApiResponse>(`${this.API_URL}/doctors/${id}/approve`, {});
  }

  rejectDoctor(id: number): Observable<ApiResponse> {
    return this.http.put<ApiResponse>(`${this.API_URL}/doctors/${id}/reject`, {});
  }
}