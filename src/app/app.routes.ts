import { Routes } from '@angular/router';
import { Login } from './components/core/login/login';
import { Dashboard } from './components/features/dashboard/dashboard';
import { Transactions } from './components/features/transactions/transactions';
import { Budgets } from './components/features/budgets/budgets';
import { Reports } from './components/features/reports/reports';
import { Users } from './components/masters/users/users';
import { authGuard } from './guards/auth.guard';

export const routes: Routes = [
	{ path: '', pathMatch: 'full', redirectTo: 'dashboard' },
	{ path: 'login', component: Login },
	{ path: 'dashboard', component: Dashboard, canActivate: [authGuard] },
	{ path: 'transactions', component: Transactions, canActivate: [authGuard] },
	{ path: 'budgets', component: Budgets, canActivate: [authGuard] },
	{ path: 'reports', component: Reports, canActivate: [authGuard] },
	{ path: 'users', component: Users, canActivate: [authGuard] },
	{ path: '**', redirectTo: 'login' },
];
