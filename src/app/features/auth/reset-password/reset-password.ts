import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators, AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../../../core/services/auth';
import { MessageService } from 'primeng/api';
import { HttpErrorResponse } from '@angular/common/http';

import { InputTextModule } from 'primeng/inputtext';
import { PasswordModule } from 'primeng/password';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';

// Custom Validator für Password-Match
export const passwordMatchValidator: ValidatorFn = (control: AbstractControl): ValidationErrors | null => {
  const password = control.get('newPassword');
  const confirmPassword = control.get('confirmPassword');
  if (password && confirmPassword && password.value !== confirmPassword.value) {
    return { passwordMismatch: true };
  }
  return null;
};

@Component({
  selector: 'app-reset-password',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule, InputTextModule, PasswordModule, ButtonModule, CardModule],
  templateUrl: './reset-password.html'
})
export class ResetPasswordComponent {
  
  step: number = 1; // 1 = Code prüfen, 2 = Neues Passwort setzen
  resetForm: FormGroup;

  constructor(private fb: FormBuilder, private authService: AuthService, private router: Router, private messageService: MessageService) {
    this.resetForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      code: ['', [Validators.required, Validators.minLength(6), Validators.maxLength(6)]],
      // Diese Felder sind im 1. Schritt egal, werden aber im 2. Schritt wichtig
      newPassword: ['', [Validators.pattern('(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9]).{6,}')]],
      confirmPassword: ['']
    }, { validators: passwordMatchValidator });
  }

  // Wird aufgerufen, wenn der Benutzer auf "Code überprüfen" klickt (Schritt 1)
  verifyCode() {
    if (this.resetForm.get('email')?.invalid || this.resetForm.get('code')?.invalid) return;

    const requestData = {
      email: this.resetForm.value.email,
      code: this.resetForm.value.code
    };

    this.authService.verifyResetCode(requestData).subscribe({
      next: () => {
        this.messageService.add({severity: 'success', summary: 'Gültig', detail: 'Code ist korrekt! Du kannst jetzt ein neues Passwort setzen.'});
        
        // Wir machen die Passwort-Felder zur Pflicht!
        this.resetForm.get('newPassword')?.setValidators([Validators.required, Validators.minLength(6), Validators.pattern('(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9]).{6,}')]);
        this.resetForm.get('confirmPassword')?.setValidators([Validators.required]);
        this.resetForm.get('newPassword')?.updateValueAndValidity();
        this.resetForm.get('confirmPassword')?.updateValueAndValidity();
        
        this.step = 2; // Gehe zu Schritt 2!
      },
      error: (err:  HttpErrorResponse) => {
        this.messageService.add({severity: 'error', summary: 'Fehler', detail: err.error?.error || 'Falscher Code oder E-Mail.'});
      }
    });
  }

  // Wird aufgerufen, wenn er sein neues Passwort speichert (Schritt 2)
  onSubmitNewPassword() {
    if (this.resetForm.invalid) return;

    const finalData = {
      email: this.resetForm.value.email,
      code: this.resetForm.value.code,
      newPassword: this.resetForm.value.newPassword
    };

    this.authService.resetPassword(finalData).subscribe({
      next: () => {
        this.messageService.add({severity: 'success', summary: 'Erfolg', detail: 'Dein Passwort wurde erfolgreich geändert!'});
        this.router.navigate(['/login']);
      },
      error: (err:  HttpErrorResponse ) => {
        this.messageService.add({severity: 'error', summary: 'Fehler', detail: err.error?.error || 'Fehler beim Ändern.'});
      }
    });
  }
}