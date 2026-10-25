import { Component, inject } from '@angular/core';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';

import { InputTextModule } from 'primeng/inputtext';
import { ButtonModule } from 'primeng/button';
import { MessageService } from 'primeng/api';

import { AuthService } from '../../../core/services/auth';
import { LegalFooterComponent } from '../../../shared/legal-footer/legal-footer';

@Component({
  selector: 'app-verify',
  standalone: true,
  imports: [ReactiveFormsModule, InputTextModule, ButtonModule, LegalFooterComponent],
  templateUrl: './verify.html',
  styleUrl: './verify.scss'
})
export class VerifyComponent {
  private readonly fb = inject(FormBuilder);
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);
  private readonly messageService = inject(MessageService);

  readonly verifyForm: FormGroup = this.fb.group({
    email: ['', [Validators.required, Validators.email]],
    code: ['', [Validators.required, Validators.pattern(/^[0-9]{6}$/)]],
  });

  onSubmit(): void {
    if (this.verifyForm.invalid) {
      this.verifyForm.markAllAsTouched();
      return;
    }

    this.authService.verify(this.verifyForm.value).subscribe({
      next: () => {
        this.messageService.add({ severity: 'success', summary: 'Erfolg', detail: 'Konto verifiziert! Du kannst dich jetzt einloggen.' });
        this.router.navigate(['/login']);
      },
      error: (err: HttpErrorResponse) => {
        this.messageService.add({ severity: 'error', summary: 'Fehler', detail: err.error?.message || 'Falscher Code.' });
      }
    });
  }
}