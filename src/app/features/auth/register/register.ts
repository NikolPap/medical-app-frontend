import { Component, DestroyRef, inject, signal } from '@angular/core';
import { NgClass } from '@angular/common';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import {
  ReactiveFormsModule, FormBuilder, FormGroup, Validators,
  AbstractControl, ValidationErrors, ValidatorFn
} from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';

import { InputTextModule } from 'primeng/inputtext';
import { PasswordModule } from 'primeng/password';
import { ButtonModule } from 'primeng/button';
import { SelectModule } from 'primeng/select';
import { MessageService } from 'primeng/api';

import { AuthService } from '../../../core/services/auth';
import { LegalFooterComponent } from '../../../shared/legal-footer/legal-footer';

export const passwordMatchValidator: ValidatorFn = (control: AbstractControl): ValidationErrors | null => {
  const password = control.get('password');
  const confirmPassword = control.get('confirmPassword');
  if (password && confirmPassword && password.value !== confirmPassword.value) {
    return { passwordMismatch: true };
  }
  return null;
};

// Erlaubt: +49 123 456789, 0049-123-456789, 0176/12345678 usw. — mind. 6 Ziffern gesamt
const PHONE_PATTERN = /^\+?[0-9\s\-\/]{6,20}$/;

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [
    NgClass, ReactiveFormsModule, RouterModule, InputTextModule,
    PasswordModule, ButtonModule, SelectModule, LegalFooterComponent
  ],
  templateUrl: './register.html'
})
export class RegisterComponent {
  private readonly fb = inject(FormBuilder);
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);
  private readonly messageService = inject(MessageService);
  private readonly destroyRef = inject(DestroyRef);

  readonly currentStep = signal<1 | 2>(1);

  readonly roles = [
    { label: 'Ich bin Patient', value: 'ROLE_PATIENT' },
    { label: 'Ich bin Arzt', value: 'ROLE_DOCTOR' }
  ];

  readonly genderOptions = [
    { label: 'Männlich', value: 'MALE' },
    { label: 'Weiblich', value: 'FEMALE' },
    { label: 'Divers', value: 'DIVERS' }
  ];

  readonly insuranceOptions = [
    { label: 'Gesetzlich versichert', value: 'GESETZLICH' },
    { label: 'Privat versichert', value: 'PRIVATE' }
  ];

  readonly registerForm: FormGroup = this.fb.group({
    role: ['ROLE_PATIENT', Validators.required],
    firstName: ['', [Validators.required, Validators.minLength(2)]],
    lastName: ['', [Validators.required, Validators.minLength(2)]],
    phoneNumber: ['', [Validators.required, Validators.pattern(PHONE_PATTERN)]],

    gender: [''],
    insuranceType: [''],

    specialty: [''],
    address: [''],

    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(6), Validators.pattern('(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9]).{6,}')]],
    confirmPassword: ['', Validators.required],

    acceptedTerms: [false, Validators.requiredTrue]
  }, { validators: passwordMatchValidator });

  constructor() {
    // Rollenabhängige Pflichtfelder — reagiert sofort auf jeden Rollenwechsel
    this.registerForm.get('role')?.valueChanges
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((role: string) => this.applyRoleValidators(role));

    this.applyRoleValidators(this.registerForm.get('role')?.value); // initial anwenden
  }

  private applyRoleValidators(role: string): void {
    const specialty = this.registerForm.get('specialty');
    const address = this.registerForm.get('address');
    const gender = this.registerForm.get('gender');
    const insuranceType = this.registerForm.get('insuranceType');

    if (role === 'ROLE_DOCTOR') {
      specialty?.setValidators([Validators.required]);
      address?.setValidators([Validators.required]);
      gender?.clearValidators();
      insuranceType?.clearValidators();
    } else {
      gender?.setValidators([Validators.required]);
      insuranceType?.setValidators([Validators.required]);
      specialty?.clearValidators();
      address?.clearValidators();
    }

    specialty?.updateValueAndValidity({ emitEvent: false });
    address?.updateValueAndValidity({ emitEvent: false });
    gender?.updateValueAndValidity({ emitEvent: false });
    insuranceType?.updateValueAndValidity({ emitEvent: false });
  }

  isStep1Valid(): boolean {
    const form = this.registerForm;
    const baseValid = !!(form.get('role')?.valid && form.get('firstName')?.valid
      && form.get('lastName')?.valid && form.get('phoneNumber')?.valid);

    if (form.get('role')?.value === 'ROLE_DOCTOR') {
      return baseValid && !!form.get('specialty')?.valid && !!form.get('address')?.valid;
    }
    return baseValid && !!form.get('gender')?.valid && !!form.get('insuranceType')?.valid;
  }

  nextStep(): void {
    if (this.isStep1Valid()) {
      this.currentStep.set(2);
      return;
    }

    // Zeigt alle roten Fehlermeldungen in Schritt 1, falls der Nutzer "Weiter" ohne Ausfüllen versucht
    ['firstName', 'lastName', 'phoneNumber', 'specialty', 'address', 'gender', 'insuranceType']
      .forEach(name => this.registerForm.get(name)?.markAsTouched());
  }

  prevStep(): void {
    this.currentStep.set(1);
  }

  onSubmit(): void {
    if (this.registerForm.invalid) {
      this.registerForm.markAllAsTouched();
      return;
    }

    this.authService.register(this.registerForm.value).subscribe({
      next: () => {
        const isDoctor = this.registerForm.value.role === 'ROLE_DOCTOR';
        this.messageService.add({
          severity: 'success',
          summary: 'Registriert',
          detail: isDoctor
            ? 'Bitte bestätige deine E-Mail. Danach prüfen wir dein Arztkonto und melden uns per E-Mail.'
            : 'Bitte prüfe deine E-Mails für den 6-stelligen Code.',
          life: 6000
        });
        this.router.navigate(['/verify']);
      },
      error: (err: HttpErrorResponse) => {
        this.messageService.add({ severity: 'error', summary: 'Fehler', detail: err.error?.message || 'Registrierung fehlgeschlagen.' });
      }
    });
  }
}