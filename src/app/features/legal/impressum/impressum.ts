import { Component } from '@angular/core';
import { RouterModule } from '@angular/router';
import { LegalFooterComponent } from '../../../shared/legal-footer/legal-footer';

@Component({
  selector: 'app-impressum',
  standalone: true,
  imports: [RouterModule, LegalFooterComponent],
  templateUrl: './impressum.html'
})
export class ImpressumComponent {}