import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators, AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';
import { Router, RouterModule } from '@angular/router'; 
import { AuthService } from '../../../core/services/auth';
import { MessageService } from 'primeng/api';


import { InputTextModule } from 'primeng/inputtext';
import { PasswordModule } from 'primeng/password';
import { ButtonModule } from 'primeng/button';
import { DropdownModule } from 'primeng/dropdown';

export const passwordMatchValidator: ValidatorFn = (control: AbstractControl): ValidationErrors | null => {
  const password = control.get('password');
  const confirmPassword = control.get('confirmPassword');
  if (password && confirmPassword && password.value !== confirmPassword.value) {
    return { passwordMismatch: true };
  }
  return null;
};

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule, InputTextModule, PasswordModule, ButtonModule, DropdownModule],
  templateUrl: './register.html'
})
export class RegisterComponent {
  
  registerForm: FormGroup;
  currentStep: number = 1; // NEU: Steuert, welches Formular-Stück gezeigt wird!
  
  roles = [
    { label: 'Ich bin Patient', value: 'ROLE_PATIENT' },
    { label: 'Ich bin Arzt', value: 'ROLE_DOCTOR' }
  ];

  constructor(private fb: FormBuilder, private authService: AuthService, private router: Router, private messageService: MessageService) {
    this.registerForm = this.fb.group({
      // Schritt 1 Felder
      role: ['ROLE_PATIENT', Validators.required],
      firstName: ['', Validators.required],
      lastName: ['', Validators.required],
      specialty: [''], // Nur für Ärzte
      address: [''],   // Nur für Ärzte
      
      // Schritt 2 Felder
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6), Validators.pattern('(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9]).{6,}')]],
      confirmPassword: ['', Validators.required]
    }, { validators: passwordMatchValidator });
  }

  // NEU: Prüft, ob Schritt 1 gültig ausgefüllt ist, bevor man weiter darf
  isStep1Valid(): boolean {
    const isBaseValid = this.registerForm.get('role')?.valid && 
                        this.registerForm.get('firstName')?.valid && 
                        this.registerForm.get('lastName')?.valid;
    
    // Wenn Arzt, müssen auch Specialty und Address ausgefüllt sein (Optional, aber gut für UX)
    if (this.registerForm.get('role')?.value === 'ROLE_DOCTOR') {
      return !!isBaseValid && !!this.registerForm.get('specialty')?.value && !!this.registerForm.get('address')?.value;
    }
    return !!isBaseValid;
  }

  nextStep() {
    if (this.isStep1Valid()) {
      this.currentStep = 2;
    }
  }

  prevStep() {
    this.currentStep = 1;
  }

  onSubmit() {
    if (this.registerForm.invalid) {
      this.registerForm.markAllAsTouched(); // Zeigt alle Fehlermeldungen an
      return;
    }

    this.authService.register(this.registerForm.value).subscribe({
      next: () => {
        this.messageService.add({severity: 'success', summary: 'Registriert', detail: 'Bitte prüfe deine E-Mails für den 6-stelligen Code.', life: 5000});
        this.router.navigate(['/verify']);
      },
      error: (err: any) => {
        this.messageService.add({severity: 'error', summary: 'Fehler', detail: err.error?.message || 'Registrierung fehlgeschlagen.'});
      }
    });
  }
}