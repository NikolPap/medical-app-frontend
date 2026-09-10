import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../../core/services/auth';

import { InputTextModule } from 'primeng/inputtext';
import { PasswordModule } from 'primeng/password';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';

@Component({
  selector: 'app-reset-password',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, InputTextModule, PasswordModule, ButtonModule, CardModule],
  templateUrl: './reset-password.html'
})
export class ResetPasswordComponent {
  
  resetForm: FormGroup;

  constructor(private fb: FormBuilder, private authService: AuthService, private router: Router) {
    this.resetForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      code: ['', [Validators.required, Validators.minLength(6), Validators.maxLength(6)]],
      newPassword: ['', [
        Validators.required, 
        Validators.minLength(6),
        Validators.pattern('(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9]).{6,}') 
      ]],
    });
  }

  onSubmit() {
    if (this.resetForm.invalid) return;

    this.authService.resetPassword(this.resetForm.value).subscribe({
      next: () => {
        alert("Dein Passwort wurde erfolgreich geändert!");
        this.router.navigate(['/login']);
      },
      error: (err: any) => {
        alert("Fehler: " + (err.error?.message || "Falscher Code oder E-Mail"));
      }
    });
  }
}