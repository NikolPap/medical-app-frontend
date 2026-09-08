import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../../../core/services/auth';

import { InputTextModule } from 'primeng/inputtext';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';

@Component({
  selector: 'app-forgot-password',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule, InputTextModule, ButtonModule, CardModule],
  templateUrl: './forgot-password.html'
})
export class ForgotPasswordComponent {
  
  forgotForm: FormGroup;

  constructor(private fb: FormBuilder, private authService: AuthService, private router: Router) {
    this.forgotForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]]
    });
  }

  onSubmit() {
    if (this.forgotForm.invalid) return;

    this.authService.forgotPassword(this.forgotForm.value).subscribe({
      next: () => {
        alert("Falls die E-Mail existiert, wurde ein Code gesendet.");
        // Leite automatisch zur Eingabe des neuen Passworts weiter!
        this.router.navigate(['/reset-password']);
      },
      error: (err: any) => {
        alert("Fehler: " + (err.error?.message || "Etwas ist schiefgelaufen"));
      }
    });
  }
}