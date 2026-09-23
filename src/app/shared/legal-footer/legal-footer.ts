import { Component } from '@angular/core';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-legal-footer',
  standalone: true,
  imports: [RouterModule],
  templateUrl: './legal-footer.html',
  host: { style: 'display: contents' }
})
export class LegalFooterComponent {}