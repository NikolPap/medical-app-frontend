import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../../core/services/auth';

import { InputTextModule } from 'primeng/inputtext';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';

@Component({
  selector: 'app-verify',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, InputTextModule, ButtonModule, CardModule],
  templateUrl: './verify.html',
  styleUrl: './verify.scss'
})
export class VerifyComponent {

  verifyForm: FormGroup;

  constructor(private fb: FormBuilder, private authService: AuthService, private router: Router) {
    this.verifyForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      code: ['', [Validators.required, Validators.minLength(6), Validators.maxLength(6)]] // Genau 6 Zeichen!
    });
  }

  onSubmit() {
    if (this.verifyForm.invalid) return;

    this.authService.verify(this.verifyForm.value).subscribe({
      next: (response: any) => {
        alert("Konto erfolgreich verifiziert! Du kannst dich jetzt einloggen.");
        // Nach Erfolg sofort zum Login leiten
        this.router.navigate(['/login']);
      },
      error: (err: any) => {
        alert("Fehler: " + (err.error?.message || "Falscher Code"));
      }
    });
  }
}