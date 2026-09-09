import { Component, inject } from '@angular/core';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';
import { AuthService } from '../../../services/auth.service';
import { UserService } from '../../masters/users/user.service';

@Component({
  imports: [RouterLink, RouterLinkActive],
  selector: 'app-sidenav',
  styleUrl: './sidenav.css',
  templateUrl: './sidenav.html',
})
export class Sidenav {
  private readonly router = inject(Router);
  private readonly authService = inject(AuthService);
  private readonly userlistService = inject(UserService);

  protected readonly menuItems = [
    { label: 'Dashboard', icon: 'dashboard', href: '/dashboard' },
    { label: 'Transactions', icon: 'receipt', href: '/transactions' },
    { label: 'Budgets', icon: 'budget', href: '/budgets' },
    { label: 'Reports', icon: 'chart', href: '/reports' },
  ];

  protected readonly masterItems = [{ label: 'Users', icon: 'users', href: '/users' }];

  protected canViewUsers(): boolean {
    return this.authService.hasPermission('users:view');
  }

  protected isCurrentRoute(path: string): boolean {
    return this.router.url === path;
  }

  protected onLogout(): void {
    this.authService.logout();
    void this.router.navigate(['/login']);
  }

  protected get userName(): string {
    return this.authService.getUsername() ?? 'Guest';
  }

  protected get initials(): string {
    const name = this.userName;
    if (!name || name === 'Guest') return 'G';
    const parts = name.trim().split(' ');
    if (parts.length > 1) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  }
  protected userList(): void {

  }
}
