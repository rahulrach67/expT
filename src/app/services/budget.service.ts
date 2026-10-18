import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface Budget {
  id: number;
  category: string;
  monthly_limit: number;
  spent: number;
  remaining: number;
  percentage: number;
}

@Injectable({ providedIn: 'root' })
export class BudgetService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = `${environment.apiUrl.replace(/\/+$/, '')}${environment.apiUrl.endsWith('/api') ? '' : '/api'}/budgets`;

  getBudgets(): Observable<Budget[]> {
    return this.http.get<Budget[]>(this.apiUrl);
  }

  saveBudget(data: { category: string; monthly_limit: number }): Observable<Budget> {
    return this.http.post<Budget>(this.apiUrl, data);
  }

  deleteBudget(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }
}
