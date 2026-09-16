import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ApiResponse } from '../models/appointment.model';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private readonly API_URL = 'http://localhost:8080/api/auth';

  constructor(private http: HttpClient) {}
   
  // STRIKTE TYPISIERUNG STATT 'ANY'
  login(loginData: unknown): Observable<ApiResponse>  {
    return this.http.post<ApiResponse>(`${this.API_URL}/login`, loginData);
  }

  register(registerData: unknown): Observable<ApiResponse> {
    return this.http.post<ApiResponse>(`${this.API_URL}/register`, registerData);
  }

  verify(verifyData: unknown): Observable<ApiResponse> {
    return this.http.post<ApiResponse>(`${this.API_URL}/verify`, verifyData);
  }

  forgotPassword(emailData: unknown): Observable<ApiResponse> {
    return this.http.post<ApiResponse>(`${this.API_URL}/forgot-password`, emailData);
  }

  resetPassword(resetData: unknown): Observable<ApiResponse> {
    return this.http.post<ApiResponse>(`${this.API_URL}/reset-password`, resetData);
  }

  verifyResetCode(data: unknown): Observable<ApiResponse> {
    return this.http.post<ApiResponse>(`${this.API_URL}/verify-reset-code`, data);
  }
}