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
import { DropdownModule } from 'primeng/dropdown';
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
    CommonModule, ReactiveFormsModule, RouterModule, InputTextModule,
    PasswordModule, ButtonModule, DropdownModule, LegalFooterComponent
  ],
  templateUrl: './register.html'
})
export class RegisterComponent {

  registerForm: FormGroup;
  currentStep: number = 1;

  roles = [
    { label: 'Ich bin Patient', value: 'ROLE_PATIENT' },
    { label: 'Ich bin Arzt', value: 'ROLE_DOCTOR' }
  ];

  genderOptions = [
    { label: 'Männlich', value: 'MALE' },
    { label: 'Weiblich', value: 'FEMALE' },
    { label: 'Divers', value: 'DIVERS' }
  ];

  insuranceOptions = [
    { label: 'Gesetzlich versichert', value: 'GESETZLICH' },
    { label: 'Privat versichert', value: 'PRIVATE' }
  ];

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router,
    private messageService: MessageService
  ) {
    this.registerForm = this.fb.group({
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

    // Rollenabhängige Pflichtfelder — reagiert sofort auf jeden Rollenwechsel
    this.registerForm.get('role')?.valueChanges.subscribe((role: string) => this.applyRoleValidators(role));
    this.applyRoleValidators(this.registerForm.get('role')?.value); // initial anwenden
  }

  private applyRoleValidators(role: string) {
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
    const base = this.registerForm.get('role');
    const firstName = this.registerForm.get('firstName');
    const lastName = this.registerForm.get('lastName');
    const phone = this.registerForm.get('phoneNumber');

    const isBaseValid = base?.valid && firstName?.valid && lastName?.valid && phone?.valid;

    if (this.registerForm.get('role')?.value === 'ROLE_DOCTOR') {
      return !!isBaseValid && !!this.registerForm.get('specialty')?.valid && !!this.registerForm.get('address')?.valid;
    } else {
      return !!isBaseValid && !!this.registerForm.get('gender')?.valid && !!this.registerForm.get('insuranceType')?.valid;
    }
  }

  nextStep() {
    if (this.isStep1Valid()) {
      this.currentStep = 2;
    } else {
      // Zeigt alle roten Fehlermeldungen im Schritt 1, falls der Nutzer "Weiter" ohne Ausfüllen versucht
      this.registerForm.get('firstName')?.markAsTouched();
      this.registerForm.get('lastName')?.markAsTouched();
      this.registerForm.get('phoneNumber')?.markAsTouched();
      this.registerForm.get('specialty')?.markAsTouched();
      this.registerForm.get('address')?.markAsTouched();
      this.registerForm.get('gender')?.markAsTouched();
      this.registerForm.get('insuranceType')?.markAsTouched();
    }
  }

  prevStep() {
    this.currentStep = 1;
  }

  onSubmit() {
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