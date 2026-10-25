import { Component, input, output } from '@angular/core';
import { NgClass } from '@angular/common';

export interface SummaryCounts {
  pending: number;
  confirmed: number;
  cancelled: number;
  all: number;
}

@Component({
  selector: 'app-summary-cards',
  standalone: true,
  imports: [NgClass],
  templateUrl: './summary-cards.html',
  host: { style: 'display: contents' }
})
export class SummaryCardsComponent {
  readonly counts = input.required<SummaryCounts>();
  readonly currentFilter = input('ALL');

  readonly filterChange = output<string>();
}