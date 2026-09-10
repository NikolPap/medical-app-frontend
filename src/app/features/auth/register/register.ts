import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router, RouterModule } from '@angular/router'; // RouterModule für den Link zurück zum Login
import { AuthService } from '../../../core/services/auth';

// PRIMENG IMPORTS
import { InputTextModule } from 'primeng/inputtext';
import { PasswordModule } from 'primeng/password';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { DropdownModule } from 'primeng/dropdown'; // Für die Rollen-Auswahl

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

  constructor(private fb: FormBuilder, private authService: AuthService, private router: Router) {
    this.registerForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
     password: ['', [
        Validators.required, 
        Validators.minLength(6),
        Validators.pattern('(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9]).{6,}') 
      ]],
      role: ['ROLE_PATIENT', Validators.required] // Standardmäßig ist man Patient
    });
  }

  onSubmit() {
    if (this.registerForm.invalid) return;

    this.authService.register(this.registerForm.value).subscribe({
      next: (response: any) => {
        alert("Erfolgreich registriert! Bitte prüfe deine Konsole für den 6-stelligen Code.");
        // Wenn fertig -> Zum Login leiten (Oder später zur Verify-Seite)
       this.router.navigate(['/verify']);
      },
      error: (err: any) => {
        alert("Fehler: " + err.error?.message);
      }
    });
  }
}