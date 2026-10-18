import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface ReportsSummary {
  summary: {
    totalIncome: number;
    totalExpenses: number;
    netSavings: number;
    savingsRate: number;
    totalTransactions: number;
  };
  categoryBreakdown: Array<{
    category: string;
    total: number;
    count: number;
    percentage: number;
  }>;
  monthlyTrends: Array<{
    month: string;
    payments: number;
    receipts: number;
  }>;
  recentTransactions: Array<{
    id: number;
    title: string;
    amount: number;
    type: 'Expense' | 'Income';
    category: string;
    date: string;
  }>;
}

@Injectable({ providedIn: 'root' })
export class ReportService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = `${environment.apiUrl.replace(/\/+$/, '')}${environment.apiUrl.endsWith('/api') ? '' : '/api'}/reports`;

  getSummary(): Observable<ReportsSummary> {
    return this.http.get<ReportsSummary>(`${this.apiUrl}/summary`);
  }
}
