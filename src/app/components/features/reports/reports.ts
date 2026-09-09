import { Component, computed, inject, signal } from '@angular/core';
import { Sidenav } from '../sidenav/sidenav';
import { ReportService, ReportsSummary } from '../../../services/report.service';

@Component({
  imports: [Sidenav],
  selector: 'app-reports',
  styleUrl: './reports.css',
  templateUrl: './reports.html',
})
export class Reports {
  private readonly reportService = inject(ReportService);

  protected readonly isLoading = signal(true);
  protected readonly errorMessage = signal('');
  protected readonly reportData = signal<ReportsSummary | null>(null);
  protected readonly selectedPeriod = signal<'This Month' | 'Last 3 Months' | 'All Time'>('This Month');

  protected readonly maxTrendAmount = computed(() => {
    const data = this.reportData();
    if (!data || data.monthlyTrends.length === 0) return 10000;
    const maxVal = Math.max(
      ...data.monthlyTrends.map((t) => Math.max(Number(t.payments), Number(t.receipts)))
    );
    return Math.max(maxVal, 1000);
  });

  constructor() {
    this.loadReport();
  }

  loadReport(): void {
    this.isLoading.set(true);
    this.errorMessage.set('');
    this.reportService.getSummary().subscribe({
      next: (res) => {
        this.reportData.set(res);
        this.isLoading.set(false);
      },
      error: (err: { error?: { message?: string } }) => {
        this.errorMessage.set(err.error?.message ?? 'Unable to load financial reports.');
        this.isLoading.set(false);
      },
    });
  }

  getBarHeight(amount: number): number {
    const max = this.maxTrendAmount();
    if (max <= 0) return 0;
    return Math.min(100, Math.max(4, Math.round((amount / max) * 100)));
  }
}
