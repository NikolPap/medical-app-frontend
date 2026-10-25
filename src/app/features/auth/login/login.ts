import { Component, inject } from '@angular/core';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';

import { InputTextModule } from 'primeng/inputtext';
import { PasswordModule } from 'primeng/password';
import { ButtonModule } from 'primeng/button';
import { MessageService } from 'primeng/api';

import { AuthService } from '../../../core/services/auth';
import { ApiResponse } from '../../../core/models/appointment.model';
import { LegalFooterComponent } from '../../../shared/legal-footer/legal-footer';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    RouterModule,
    InputTextModule,
    PasswordModule,
    ButtonModule,
    LegalFooterComponent
  ],
  templateUrl: './login.html',
  styleUrl: './login.scss',
})
export class Login {
  private readonly fb = inject(FormBuilder);
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);
  private readonly messageService = inject(MessageService);

  readonly loginForm: FormGroup = this.fb.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(6)]],
  });

  onSubmit(): void {
    if (this.loginForm.invalid) return;

    this.authService.login(this.loginForm.value).subscribe({
      next: (response: ApiResponse) => {
        localStorage.setItem('jwt_token', response.token!);
        this.messageService.add({ severity: 'success', summary: 'Erfolg', detail: 'Login erfolgreich!' });
        this.router.navigate([response.role === 'ROLE_ADMIN' ? '/admin' : '/dashboard']);
      },
      error: (err: HttpErrorResponse) => {
        this.messageService.add({ severity: 'error', summary: 'Fehler', detail: err.error?.message || 'Login fehlgeschlagen.' });
      },
    });
  }
}