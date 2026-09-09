import { Component, computed, inject, signal } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Sidenav } from '../sidenav/sidenav';
import { Budget, BudgetService } from '../../../services/budget.service';

@Component({
  imports: [ReactiveFormsModule, Sidenav],
  selector: 'app-budgets',
  styleUrl: './budgets.css',
  templateUrl: './budgets.html',
})
export class Budgets {
  private readonly budgetService = inject(BudgetService);

  protected readonly isLoading = signal(true);
  protected readonly isSaving = signal(false);
  protected readonly errorMessage = signal('');
  protected readonly budgets = signal<Budget[]>([]);
  protected readonly showSetForm = signal(false);

  protected readonly categories = [
    'Food', 'Travel', 'Utilities', 'Shopping', 
    'Entertainment', 'Healthcare', 'Groceries', 'Personal', 'Other'
  ];

  protected readonly budgetForm = new FormGroup({
    category: new FormControl('Food', { nonNullable: true, validators: [Validators.required] }),
    monthly_limit: new FormControl<number | null>(null, { validators: [Validators.required, Validators.min(100)] }),
  });

  protected readonly totalBudget = computed(() =>
    this.budgets().reduce((acc, b) => acc + Number(b.monthly_limit), 0)
  );

  protected readonly totalSpent = computed(() =>
    this.budgets().reduce((acc, b) => acc + Number(b.spent), 0)
  );

  protected readonly totalRemaining = computed(() =>
    Math.max(0, this.totalBudget() - this.totalSpent())
  );

  protected readonly overallPercentage = computed(() => {
    const total = this.totalBudget();
    if (total <= 0) return 0;
    return Math.min(100, Math.round((this.totalSpent() / total) * 100));
  });

  constructor() {
    this.loadBudgets();
  }

  loadBudgets(): void {
    this.isLoading.set(true);
    this.errorMessage.set('');
    this.budgetService.getBudgets().subscribe({
      next: (data) => {
        this.budgets.set(data);
        this.isLoading.set(false);
      },
      error: (err: { error?: { message?: string } }) => {
        this.errorMessage.set(err.error?.message ?? 'Unable to load budgets.');
        this.isLoading.set(false);
      },
    });
  }

  toggleSetForm(existing?: Budget): void {
    if (this.showSetForm() && !existing) {
      this.showSetForm.set(false);
      return;
    }

    if (existing) {
      this.budgetForm.reset({
        category: existing.category,
        monthly_limit: existing.monthly_limit,
      });
    } else {
      this.budgetForm.reset({
        category: 'Food',
        monthly_limit: null,
      });
    }
    this.showSetForm.set(true);
  }

  saveBudget(): void {
    if (this.budgetForm.invalid) {
      this.budgetForm.markAllAsTouched();
      return;
    }

    const val = this.budgetForm.getRawValue();
    if (!val.monthly_limit || val.monthly_limit <= 0) return;

    this.isSaving.set(true);
    this.errorMessage.set('');

    this.budgetService
      .saveBudget({
        category: val.category,
        monthly_limit: val.monthly_limit,
      })
      .subscribe({
        next: () => {
          this.isSaving.set(false);
          this.showSetForm.set(false);
          this.loadBudgets();
        },
        error: (err: { error?: { message?: string } }) => {
          this.errorMessage.set(err.error?.message ?? 'Unable to save budget.');
          this.isSaving.set(false);
        },
      });
  }

  deleteBudget(budget: Budget): void {
    if (!confirm(`Remove budget for ${budget.category}?`)) return;

    this.budgetService.deleteBudget(budget.id).subscribe({
      next: () => {
        this.budgets.update((prev) => prev.filter((b) => b.id !== budget.id));
      },
      error: (err: { error?: { message?: string } }) => {
        this.errorMessage.set(err.error?.message ?? 'Unable to delete budget.');
      },
    });
  }

  getStatusClass(pct: number): string {
    if (pct >= 100) return 'danger';
    if (pct >= 75) return 'warning';
    return 'safe';
  }
}
