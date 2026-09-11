import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router, RouterModule } from '@angular/router'; // RouterModule für den Link zurück zum Login
import { AuthService } from '../../../core/services/auth';
import { AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';

// PRIMENG IMPORTS
import { InputTextModule } from 'primeng/inputtext';
import { PasswordModule } from 'primeng/password';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { DropdownModule } from 'primeng/dropdown';
import { MessageService } from 'primeng/api';

export const passwordMatchValidator: ValidatorFn = (control: AbstractControl): ValidationErrors | null => {
  const password = control.get('password');
  const confirmPassword = control.get('confirmPassword');
  
  // Wenn die Passwörter nicht übereinstimmen, geben wir einen Fehler ('passwordMismatch') zurück!
  if (password && confirmPassword && password.value !== confirmPassword.value) {
    return { passwordMismatch: true };
  }
  return null;
};

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule, InputTextModule, PasswordModule, ButtonModule, CardModule, DropdownModule],
  templateUrl: './register.html',
  styleUrl: './register.scss'
})
export class RegisterComponent {
  
  registerForm: FormGroup;
  
  // Die Optionen für unser PrimeNG Dropdown
  roles = [
    { label: 'Ich bin Patient', value: 'ROLE_PATIENT' },
    { label: 'Ich bin Arzt', value: 'ROLE_DOCTOR' }
  ];

 constructor(private fb: FormBuilder, private authService: AuthService, private router: Router, private messageService: MessageService) {
    this.registerForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      role: ['ROLE_PATIENT', Validators.required],
      password: ['', [Validators.required, Validators.minLength(6), Validators.pattern('(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9]).{6,}')]],
      confirmPassword: ['', Validators.required] // NEUES FELD!
    }, { validators: passwordMatchValidator }); // CUSTOM VALIDATOR FÜR DAS GANZE FORMULAR!
  }

onSubmit() {
    if (this.registerForm.invalid) return;
    this.authService.register(this.registerForm.value).subscribe({
      next: (response: any) => {
        // Hier lassen wir das Toast etwas länger stehen (5 Sekunden statt 3)
        this.messageService.add({severity: 'success', summary: 'Registriert', detail: 'Bitte prüfe deine E-Mails für den 6-stelligen Code.', life: 5000});
        this.router.navigate(['/verify']);
      },
      error: (err: any) => {
        this.messageService.add({severity: 'error', summary: 'Fehler', detail: err.error?.message || 'Registrierung fehlgeschlagen.'});
      }
    });
  }
}