import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router'; // 1. IMPORT ROUTER HINZUGEFÜGT

import { AuthService } from '../../../core/services/auth'; 
// (Optional) Wenn du das Interface hast, importiere es hier:
// import { AuthResponse } from '../../../core/models/auth.model';

// --- PRIMENG IMPORTS ---
import { InputTextModule } from 'primeng/inputtext';
import { PasswordModule } from 'primeng/password';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    InputTextModule,
    PasswordModule,
    ButtonModule,
    CardModule,
  ],
  templateUrl: './login.html',
  styleUrl: './login.scss',
})
export class Login {
  loginForm: FormGroup;

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router // 2. ROUTER IM KONSTRUKTOR HINZUGEFÜGT
  ) {
    this.loginForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]],
    });
  }

  onSubmit() {
    if (this.loginForm.invalid) {
      console.error('Formular ist ungültig!');
      return;
    }

    this.authService.login(this.loginForm.value).subscribe({
      // 3. Typ 'any' entfernt (Wenn du das Model nicht importiert hast, kannst du es weglassen)
      next: (response) => {
        console.log('Erfolgreich eingeloggt! Hier ist die Antwort von Spring Boot:', response);
        localStorage.setItem('jwt_token', response.token);
        
        // 4. WEITERLEITUNG ZUM DASHBOARD (Das hat gefehlt!)
        this.router.navigate(['/dashboard']);
      },
      error: (err) => {
        console.error('Fehler beim Login:', err);
        alert('Fehler: ' + err.error?.message);
      },
    });
  }
}