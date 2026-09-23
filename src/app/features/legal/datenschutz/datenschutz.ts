import { Component } from '@angular/core';
import { RouterModule } from '@angular/router';
import { LegalFooterComponent } from '../../../shared/legal-footer/legal-footer';

@Component({
  selector: 'app-datenschutz',
  standalone: true,
  imports: [RouterModule, LegalFooterComponent],
  templateUrl: './datenschutz.html'
})
export class DatenschutzComponent {}