import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';

// ACHTUNG: Passe diesen Pfad an, je nachdem wo deine auth.service.ts Datei liegt!
import { AuthService } from '../../../core/services/auth';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './login.html',
  styleUrl: './login.scss',
})
export class Login {
  loginForm: FormGroup;

  // Wir rufen jetzt den richtigen AuthService auf
  constructor(private fb: FormBuilder, private authService: AuthService) {
    this.loginForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]]
    });
  }

  onSubmit() {
    if (this.loginForm.invalid) {
      console.error("Formular ist ungültig!");
      return;
    }
    
    this.authService.login(this.loginForm.value).subscribe({
      next: (response: any) => {
        console.log("Erfolgreich eingeloggt! Hier ist die Antwort von Spring Boot:", response);
        localStorage.setItem('jwt_token', response.token); 
        alert("Login erfolgreich!");
      },
      error: (err: any) => {
        console.error("Fehler beim Login:", err);
        alert("Fehler: " + err.error?.message); 
      }
    });

  }
}