import { Component, inject, signal } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatTableModule } from '@angular/material/table';
import { Sidenav } from '../../features/sidenav/sidenav';
import { UserService } from './user.service';
import { AuthService } from '../../../services/auth.service';

interface UserRow {
  id: number;
  username: string;
  email: string;
  role: string;
  status: 'Active' | 'Pending';
  joined: string;
}

@Component({
  imports: [MatTableModule, ReactiveFormsModule, Sidenav],
  selector: 'app-users',
  styleUrl: './users.css',
  templateUrl: './users.html',
})
export class Users {
  private readonly userService = inject(UserService);
  private readonly authService = inject(AuthService);
  protected readonly isLoading = signal(true);
  protected readonly isSaving = signal(false);
  protected readonly errorMessage = signal('');
  protected readonly users = signal<UserRow[]>([]);
  protected readonly displayedColumns = ['user', 'role', 'status', 'joined', 'actions'];
  protected readonly showCreateForm = signal(false);
  protected readonly editingUserId = signal<number | null>(null);
  protected readonly userForm = new FormGroup({
    username: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    email: new FormControl('', { nonNullable: true, validators: [Validators.required, Validators.email] }),
    password: new FormControl('', { nonNullable: true, validators: [Validators.minLength(6)] }),
    role: new FormControl('Member', { nonNullable: true, validators: [Validators.required] }),
  });

  constructor() {
    this.loadUsers();
  }

  protected canCreate(): boolean { return this.authService.hasPermission('users:create'); }
  protected canUpdate(): boolean { return this.authService.hasPermission('users:update'); }
  protected canDelete(): boolean { return this.authService.hasPermission('users:delete'); }

  private loadUsers(): void {
    this.userService.getUsers().subscribe({
      next: (users) => {
        this.users.set(users.map((user) => ({
          id: user.id,
          username: user.username,
          email: user.email,
          role: user.role,
          status: 'Active',
          joined: new Date(user.created_at).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }),
        })));
        this.isLoading.set(false);
      },
      error: (error: { error?: { message?: string } }) => {
        this.errorMessage.set(error.error?.message ?? 'Unable to load users. Check the API and database connection.');
        this.isLoading.set(false);
      },
    });
  }

  protected toggleCreateForm(): void {
    if (this.showCreateForm()) {
      this.closeForm();
      return;
    }

    this.editingUserId.set(null);
    this.userForm.reset({ username: '', email: '', password: '', role: 'Member' });
    this.userForm.controls.password.setValidators([Validators.required, Validators.minLength(6)]);
    this.userForm.controls.password.updateValueAndValidity();
    this.showCreateForm.set(true);
  }

  protected editUser(user: UserRow): void {
    this.editingUserId.set(user.id);
    this.userForm.reset({ username: user.username, email: user.email, password: '', role: user.role });
    this.userForm.controls.password.setValidators([Validators.minLength(6)]);
    this.userForm.controls.password.updateValueAndValidity();
    this.errorMessage.set('');
    this.showCreateForm.set(true);
  }

  protected deleteUser(user: UserRow): void {
    if (!this.canDelete() || !confirm(`Delete ${user.username}?`)) return;

    this.userService.deleteUser(user.id).subscribe({
      next: () => this.users.update((users) => users.filter((item) => item.id !== user.id)),
      error: (error: { error?: { message?: string } }) => this.errorMessage.set(error.error?.message ?? 'Unable to delete user right now.'),
    });
  }

  protected closeForm(): void {
    this.showCreateForm.set(false);
    this.editingUserId.set(null);
    this.errorMessage.set('');
  }

  protected saveUser(): void {
    if (this.userForm.invalid) {
      this.userForm.markAllAsTouched();
      return;
    }

    this.isSaving.set(true);
    this.errorMessage.set('');
    const values = this.userForm.getRawValue();
    const request = this.editingUserId() === null
      ? this.userService.createUser(values)
      : this.userService.updateUser(this.editingUserId()!, values);
    request.subscribe({
      next: (user) => {
        const joined = this.users().find((item) => item.id === user.id)?.joined ?? 'Today';
        const updatedUser = { id: user.id, username: user.username, email: user.email, role: user.role, status: 'Active' as const, joined };
        this.users.update((users) => this.editingUserId() === null ? [updatedUser, ...users] : users.map((item) => item.id === user.id ? updatedUser : item));
        this.userForm.reset({ username: '', email: '', password: '', role: 'Member' });
        this.showCreateForm.set(false);
        this.editingUserId.set(null);
        this.isSaving.set(false);
      },
      error: (error: { error?: { message?: string } }) => {
        this.errorMessage.set(error.error?.message ?? 'Unable to create user right now.');
        this.isSaving.set(false);
      },
    });
  }
}
