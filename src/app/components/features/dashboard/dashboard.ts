import { Component, HostListener, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { Sidenav } from '../sidenav/sidenav';
import { TransactionService } from '../../../services/transaction.service';
import { ReportService, ReportsSummary } from '../../../services/report.service';
import { BudgetService, Budget } from '../../../services/budget.service';
import { AuthService } from '../../../services/auth.service';

export interface DashboardTransactionItem {
  id: number;
  title: string;
  amount: number;
  type: 'Expense' | 'Income';
  category: string;
  date: string;
}

@Component({
  imports: [CommonModule, ReactiveFormsModule, RouterLink, Sidenav],
  selector: 'app-dashboard',
  styleUrl: './dashboard.css',
  templateUrl: './dashboard.html',
})
export class Dashboard {
  private readonly txService = inject(TransactionService);
  private readonly reportService = inject(ReportService);
  private readonly budgetService = inject(BudgetService);
  private readonly authService = inject(AuthService);

  protected readonly showAddModal = signal(false);
  protected readonly isSavingExpense = signal(false);
  protected readonly expenseError = signal('');
  protected readonly expenseSuccess = signal('');

  protected readonly reportData = signal<ReportsSummary | null>(null);
  protected readonly budgets = signal<Budget[]>([]);

  protected readonly categories = [
    'Food',
    'Travel',
    'Utilities',
    'Shopping',
    'Entertainment',
    'Healthcare',
    'Groceries',
    'Personal',
    'Other',
  ];

  protected readonly expenseForm = new FormGroup({
    title: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    amount: new FormControl<number | null>(null, { validators: [Validators.required, Validators.min(1)] }),
    category: new FormControl('Food', { nonNullable: true, validators: [Validators.required] }),
    date: new FormControl(new Date().toISOString().split('T')[0], { nonNullable: true, validators: [Validators.required] }),
    notes: new FormControl('', { nonNullable: true }),
  });

  protected readonly username = computed(() => {
    return this.authService.getUsername() ?? 'Rahul';
  });

  protected readonly formattedDate = computed(() => {
    return new Intl.DateTimeFormat('en-US', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    }).format(new Date());
  });

  protected readonly netBalance = computed(() => {
    return this.reportData()?.summary?.netSavings ?? 0;
  });

  protected readonly totalExpenses = computed(() => {
    return this.reportData()?.summary?.totalExpenses ?? 0;
  });

  protected readonly totalTransactions = computed(() => {
    return this.reportData()?.summary?.totalTransactions ?? 0;
  });

  protected readonly recentTransactions = computed<DashboardTransactionItem[]>(() => {
    return this.reportData()?.recentTransactions ?? [];
  });

  protected readonly totalBudget = computed(() => {
    const bList = this.budgets();
    return bList.reduce((acc, b) => acc + Number(b.monthly_limit), 0);
  });

  protected readonly totalSpent = computed(() => {
    const bList = this.budgets();
    return bList.reduce((acc, b) => acc + Number(b.spent), 0);
  });

  protected readonly budgetPercentage = computed(() => {
    const total = this.totalBudget();
    if (total <= 0) return 0;
    return Math.min(100, Math.round((this.totalSpent() / total) * 100));
  });

  protected readonly chartData = computed(() => {
    const trends = this.reportData()?.monthlyTrends;
    if (trends && trends.length > 0) {
      const maxVal = Math.max(
        ...trends.map((t) => Math.max(Number(t.payments), Number(t.receipts))),
        1
      );
      return trends.map((t) => ({
        month: t.month,
        payments: Math.min(100, Math.max(4, Math.round((Number(t.payments) / maxVal) * 100))),
        receipts: Math.min(100, Math.max(4, Math.round((Number(t.receipts) / maxVal) * 100))),
      }));
    }
    return [];
  });

  constructor() {
    this.loadDashboardData();
  }

  loadDashboardData(): void {
    this.reportService.getSummary().subscribe({
      next: (res) => {
        this.reportData.set(res);
      },
      error: () => {},
    });

    this.budgetService.getBudgets().subscribe({
      next: (b) => {
        this.budgets.set(b);
      },
      error: () => {},
    });
  }

  openAddExpense(): void {
    this.expenseError.set('');
    this.expenseSuccess.set('');
    this.expenseForm.reset({
      title: '',
      amount: null,
      category: 'Food',
      date: new Date().toISOString().split('T')[0],
      notes: '',
    });
    this.showAddModal.set(true);
  }

  closeAddExpense(): void {
    this.showAddModal.set(false);
    this.expenseError.set('');
  }

  @HostListener('document:keydown.escape')
  onEscapePress(): void {
    if (this.showAddModal()) {
      this.closeAddExpense();
    }
  }

  saveExpense(): void {
    if (this.expenseForm.invalid) {
      this.expenseForm.markAllAsTouched();
      return;
    }

    const val = this.expenseForm.getRawValue();
    if (!val.amount || val.amount <= 0) {
      this.expenseError.set('Please enter a valid amount.');
      return;
    }

    this.isSavingExpense.set(true);
    this.expenseError.set('');

    this.txService
      .createTransaction({
        title: val.title.trim(),
        amount: val.amount,
        type: 'Expense',
        category: val.category,
        date: val.date,
        notes: val.notes.trim() || undefined,
      })
      .subscribe({
        next: (created) => {
          this.isSavingExpense.set(false);
          this.showAddModal.set(false);
          this.expenseSuccess.set(`Expense "${created.title}" of ₹${Number(created.amount).toLocaleString('en-IN')} added successfully!`);
          this.loadDashboardData();
          setTimeout(() => {
            this.expenseSuccess.set('');
          }, 4500);
        },
        error: (err: { error?: { message?: string } }) => {
          this.isSavingExpense.set(false);
          this.expenseError.set(err.error?.message ?? 'Unable to save expense. Please try again.');
        },
      });
  }

  getCategoryClass(category: string): string {
    const key = category?.toLowerCase() || '';
    if (key.includes('food')) return 'food';
    if (key.includes('travel')) return 'travel';
    if (key.includes('util')) return 'utilities';
    if (key.includes('shop')) return 'shopping';
    if (key.includes('entertain')) return 'entertainment';
    if (key.includes('health')) return 'healthcare';
    if (key.includes('groc')) return 'groceries';
    if (key.includes('person')) return 'personal';
    return 'other';
  }

  getCategoryInitial(category: string): string {
    return (category || 'E').charAt(0).toUpperCase();
  }

  formatTxDate(dateStr: string): string {
    if (!dateStr) return '';
    if (dateStr.includes('Today') || dateStr.includes('Yesterday')) return dateStr;
    try {
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return dateStr;
      return new Intl.DateTimeFormat('en-IN', { day: 'numeric', month: 'short' }).format(d);
    } catch {
      return dateStr;
    }
  }
}
