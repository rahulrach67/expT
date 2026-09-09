import { Component, computed, inject, signal } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Sidenav } from '../sidenav/sidenav';
import { Transaction, TransactionService } from '../../../services/transaction.service';

@Component({
  imports: [ReactiveFormsModule, Sidenav],
  selector: 'app-transactions',
  styleUrl: './transactions.css',
  templateUrl: './transactions.html',
})
export class Transactions {
  private readonly txService = inject(TransactionService);

  protected readonly isLoading = signal(true);
  protected readonly isSaving = signal(false);
  protected readonly errorMessage = signal('');
  protected readonly transactions = signal<Transaction[]>([]);
  protected readonly showAddForm = signal(false);

  protected readonly filterType = signal<'All' | 'Expense' | 'Income'>('All');
  protected readonly filterCategory = signal<string>('All');
  protected readonly searchQuery = signal<string>('');

  protected readonly categories = [
    'Food', 'Travel', 'Utilities', 'Shopping', 
    'Entertainment', 'Healthcare', 'Salary', 'Freelance', 'Other'
  ];

  protected readonly txForm = new FormGroup({
    title: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    amount: new FormControl<number | null>(null, { validators: [Validators.required, Validators.min(1)] }),
    type: new FormControl<'Expense' | 'Income'>('Expense', { nonNullable: true, validators: [Validators.required] }),
    category: new FormControl('Food', { nonNullable: true, validators: [Validators.required] }),
    date: new FormControl(new Date().toISOString().split('T')[0], { nonNullable: true, validators: [Validators.required] }),
    notes: new FormControl('', { nonNullable: true }),
  });

  protected readonly totalIncome = computed(() =>
    this.transactions()
      .filter((t) => t.type === 'Income')
      .reduce((sum, t) => sum + Number(t.amount), 0)
  );

  protected readonly totalExpenses = computed(() =>
    this.transactions()
      .filter((t) => t.type === 'Expense')
      .reduce((sum, t) => sum + Number(t.amount), 0)
  );

  protected readonly netBalance = computed(() =>
    this.totalIncome() - this.totalExpenses()
  );

  protected readonly filteredTransactions = computed(() => {
    let list = this.transactions();
    const type = this.filterType();
    const cat = this.filterCategory();
    const query = this.searchQuery().toLowerCase().trim();

    if (type !== 'All') {
      list = list.filter((t) => t.type === type);
    }
    if (cat !== 'All') {
      list = list.filter((t) => t.category.toLowerCase() === cat.toLowerCase());
    }
    if (query) {
      list = list.filter(
        (t) =>
          t.title.toLowerCase().includes(query) ||
          t.category.toLowerCase().includes(query) ||
          (t.notes && t.notes.toLowerCase().includes(query))
      );
    }
    return list;
  });

  constructor() {
    this.loadTransactions();
  }

  loadTransactions(): void {
    this.isLoading.set(true);
    this.errorMessage.set('');
    this.txService.getTransactions().subscribe({
      next: (data) => {
        this.transactions.set(data);
        this.isLoading.set(false);
      },
      error: (err: { error?: { message?: string } }) => {
        this.errorMessage.set(err.error?.message ?? 'Unable to load transactions.');
        this.isLoading.set(false);
      },
    });
  }

  toggleAddForm(): void {
    this.showAddForm.update((v) => !v);
    if (this.showAddForm()) {
      this.txForm.reset({
        title: '',
        amount: null,
        type: 'Expense',
        category: 'Food',
        date: new Date().toISOString().split('T')[0],
        notes: '',
      });
    }
  }

  saveTransaction(): void {
    if (this.txForm.invalid) {
      this.txForm.markAllAsTouched();
      return;
    }

    const val = this.txForm.getRawValue();
    if (!val.amount || val.amount <= 0) return;

    this.isSaving.set(true);
    this.errorMessage.set('');

    this.txService
      .createTransaction({
        title: val.title,
        amount: val.amount,
        type: val.type,
        category: val.category,
        date: val.date,
        notes: val.notes,
      })
      .subscribe({
        next: (created) => {
          this.transactions.update((prev) => [created, ...prev]);
          this.isSaving.set(false);
          this.showAddForm.set(false);
        },
        error: (err: { error?: { message?: string } }) => {
          this.errorMessage.set(err.error?.message ?? 'Unable to save transaction.');
          this.isSaving.set(false);
        },
      });
  }

  deleteTransaction(tx: Transaction): void {
    if (!confirm(`Delete transaction "${tx.title}"?`)) return;

    this.txService.deleteTransaction(tx.id).subscribe({
      next: () => {
        this.transactions.update((prev) => prev.filter((t) => t.id !== tx.id));
      },
      error: (err: { error?: { message?: string } }) => {
        this.errorMessage.set(err.error?.message ?? 'Unable to delete transaction.');
      },
    });
  }
}
