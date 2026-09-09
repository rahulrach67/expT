import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface Transaction {
  id: number;
  user_id?: number | null;
  title: string;
  amount: number;
  type: 'Expense' | 'Income';
  category: string;
  date: string;
  notes?: string;
  created_at: string;
}

export interface CreateTransactionDto {
  title: string;
  amount: number;
  type: 'Expense' | 'Income';
  category: string;
  date?: string;
  notes?: string;
}

@Injectable({ providedIn: 'root' })
export class TransactionService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = '/api/transactions';

  getTransactions(): Observable<Transaction[]> {
    return this.http.get<Transaction[]>(this.apiUrl);
  }

  createTransaction(data: CreateTransactionDto): Observable<Transaction> {
    return this.http.post<Transaction>(this.apiUrl, data);
  }

  deleteTransaction(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }
}
