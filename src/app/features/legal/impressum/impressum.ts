import { Component, inject } from '@angular/core';
import { Location } from '@angular/common';
import { RouterModule } from '@angular/router';
import { LegalFooterComponent } from '../../../shared/legal-footer/legal-footer';

@Component({
  selector: 'app-impressum',
  standalone: true,
  imports: [RouterModule, LegalFooterComponent],
  templateUrl: './impressum.html'
})
export class ImpressumComponent {
  private readonly location = inject(Location);

  get homeLink(): string {
    return localStorage.getItem('jwt_token') ? '/dashboard' : '/login';
  }

  goBack() {
    this.location.back();
  }
}