import { Component } from '@angular/core';
import { RouterModule } from '@angular/router';
import { LegalFooterComponent } from '../../../shared/legal-footer/legal-footer';

@Component({
  selector: 'app-agb',
  standalone: true,
  imports: [RouterModule, LegalFooterComponent],
  templateUrl: './agb.html'
})
export class AgbComponent {}