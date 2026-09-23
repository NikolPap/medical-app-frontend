import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router, RouterModule } from '@angular/router'; 
import { ApiResponse } from '../../../core/models/appointment.model';
import { HttpErrorResponse } from '@angular/common/http';


import { AuthService } from '../../../core/services/auth'; 

// --- PRIMENG IMPORTS ---
import { InputTextModule } from 'primeng/inputtext';
import { PasswordModule } from 'primeng/password';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { MessageService } from 'primeng/api';
import { LegalFooterComponent } from '../../../shared/legal-footer/legal-footer';

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
    RouterModule,
    LegalFooterComponent
  ],
  templateUrl: './login.html',
  styleUrl: './login.scss',
})
export class Login {
  loginForm: FormGroup;

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router,
     private messageService: MessageService
  ) {
    this.loginForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]],
    });
  }

  onSubmit() {
    if (this.loginForm.invalid) return;
    this.authService.login(this.loginForm.value).subscribe({
      next: (response: ApiResponse) => {
        localStorage.setItem('jwt_token', response.token!);
        this.messageService.add({severity: 'success', summary: 'Erfolg', detail: 'Login erfolgreich!'});
        this.router.navigate(['/dashboard']);
      },
      error: (err: HttpErrorResponse) => {
        this.messageService.add({severity: 'error', summary: 'Fehler', detail: err.error?.message || 'Login fehlgeschlagen.'});
      },
    });
  }

}