import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';

export interface SummaryCounts {
  pending: number;
  confirmed: number;
  cancelled: number;
  all: number;
}

@Component({
   selector: 'app-summary-cards',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './summary-cards.html',
  host: { style: 'display: contents' }
})
export class SummaryCardsComponent {
  @Input() counts: SummaryCounts = { pending: 0, confirmed: 0, cancelled: 0, all: 0 };
  @Input() currentFilter: string = 'ALL';
  @Output() filterChange = new EventEmitter<string>();
}