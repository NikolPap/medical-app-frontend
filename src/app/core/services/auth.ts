import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private readonly API_URL = 'http://localhost:8080/api/auth';

  constructor(private http: HttpClient) {}
   
  login(loginData: any) : Observable<any>  {
    return this.http.post(`${this.API_URL}/login`, loginData)
  }

  // POST-Request für die Registrierung
  register(registerData: any): Observable<any> {
    return this.http.post(`${this.API_URL}/register`, registerData);
  }

  // POST-Request für die E-Mail Verifizierung
  verify(verifyData: any): Observable<any> {
    return this.http.post(`${this.API_URL}/verify`, verifyData);
  }

  // POST-Request: "Ich habe mein Passwort vergessen" (Schickt die E-Mail)
  forgotPassword(emailData: any): Observable<any> {
    return this.http.post(`${this.API_URL}/forgot-password`, emailData);
  }

  // POST-Request: "Hier ist der Code und mein neues Passwort"
  resetPassword(resetData: any): Observable<any> {
    return this.http.post(`${this.API_URL}/reset-password`, resetData);
  }

  // NEU: Prüft, ob der 6-stellige Code korrekt ist
  verifyResetCode(data: any): Observable<any> {
    return this.http.post(`${this.API_URL}/verify-reset-code`, data);
  }
  
}