import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../../core/services/auth';
import { ApiResponse } from '../../../core/models/appointment.model';
import { HttpErrorResponse } from '@angular/common/http';

import { InputTextModule } from 'primeng/inputtext';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { MessageService } from 'primeng/api';
import { LegalFooterComponent } from '../../../shared/legal-footer/legal-footer';

@Component({
  selector: 'app-verify',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, InputTextModule, ButtonModule, CardModule, LegalFooterComponent],
  templateUrl: './verify.html',
  styleUrl: './verify.scss'
})
export class VerifyComponent {

  verifyForm: FormGroup;

  constructor(private fb: FormBuilder, private authService: AuthService, private router: Router,  private messageService: MessageService) {
    this.verifyForm = this.fb.group({
  email: ['', [Validators.required, Validators.email]],
  code: ['', [Validators.required, Validators.pattern(/^[0-9]{6}$/)]],
});
  }

 onSubmit() {
    if (this.verifyForm.invalid) {
    this.verifyForm.markAllAsTouched();
    return;
  }
    this.authService.verify(this.verifyForm.value).subscribe({
      next: (response: ApiResponse) => {
        this.messageService.add({severity: 'success', summary: 'Erfolg', detail: 'Konto verifiziert! Du kannst dich jetzt einloggen.'});
        this.router.navigate(['/login']);
      },
      error: (err: HttpErrorResponse) => {
        this.messageService.add({severity: 'error', summary: 'Fehler', detail: err.error?.message || 'Falscher Code.'});
      }
    });
  }
}