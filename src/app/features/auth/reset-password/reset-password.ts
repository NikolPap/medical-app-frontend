import { Component, inject, signal } from '@angular/core';
import {
  ReactiveFormsModule, FormBuilder, FormGroup, Validators,
  AbstractControl, ValidationErrors, ValidatorFn
} from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';

import { InputTextModule } from 'primeng/inputtext';
import { PasswordModule } from 'primeng/password';
import { ButtonModule } from 'primeng/button';
import { MessageService } from 'primeng/api';

import { AuthService } from '../../../core/services/auth';
import { LegalFooterComponent } from '../../../shared/legal-footer/legal-footer';

const PASSWORD_PATTERN = '(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9]).{6,}';

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
  imports: [ReactiveFormsModule, RouterModule, InputTextModule, PasswordModule, ButtonModule, LegalFooterComponent],
  templateUrl: './reset-password.html'
})
export class ResetPasswordComponent {
  private readonly fb = inject(FormBuilder);
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);
  private readonly messageService = inject(MessageService);

  /** 1 = Code prüfen, 2 = Neues Passwort setzen */
  readonly step = signal<1 | 2>(1);

  readonly resetForm: FormGroup = this.fb.group({
    email: ['', [Validators.required, Validators.email]],
    code: ['', [Validators.required, Validators.pattern(/^[0-9]{6}$/)]],
    newPassword: ['', [Validators.pattern(PASSWORD_PATTERN)]],
    confirmPassword: ['']
  }, { validators: passwordMatchValidator });

  // Schritt 1: Code prüfen
  verifyCode(): void {
    const email = this.resetForm.get('email');
    const code = this.resetForm.get('code');

    if (email?.invalid || code?.invalid) {
      email?.markAsTouched();
      code?.markAsTouched();
      return;
    }

    this.authService.verifyResetCode({ email: email?.value, code: code?.value }).subscribe({
      next: () => {
        this.messageService.add({ severity: 'success', summary: 'Gültig', detail: 'Code ist korrekt! Du kannst jetzt ein neues Passwort setzen.' });

        // In Schritt 2 sind die Passwort-Felder Pflicht
        const newPassword = this.resetForm.get('newPassword');
        const confirmPassword = this.resetForm.get('confirmPassword');
        newPassword?.setValidators([Validators.required, Validators.minLength(6), Validators.pattern(PASSWORD_PATTERN)]);
        confirmPassword?.setValidators([Validators.required]);
        newPassword?.updateValueAndValidity();
        confirmPassword?.updateValueAndValidity();

        this.step.set(2);
      },
      error: (err: HttpErrorResponse) => {
        this.messageService.add({ severity: 'error', summary: 'Fehler', detail: err.error?.message || 'Falscher Code oder E-Mail.' });
      }
    });
  }

  // Schritt 2: neues Passwort speichern
  onSubmitNewPassword(): void {
    if (this.resetForm.invalid) return;

    const { email, code, newPassword } = this.resetForm.value;

    this.authService.resetPassword({ email, code, newPassword }).subscribe({
      next: () => {
        this.messageService.add({ severity: 'success', summary: 'Erfolg', detail: 'Dein Passwort wurde erfolgreich geändert!' });
        this.router.navigate(['/login']);
      },
      error: (err: HttpErrorResponse) => {
        this.messageService.add({ severity: 'error', summary: 'Fehler', detail: err.error?.message || 'Fehler beim Ändern.' });
      }
    });
  }
}