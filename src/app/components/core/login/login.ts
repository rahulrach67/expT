import { Component, inject, signal } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../../services/auth.service';

@Component({
  imports: [ReactiveFormsModule],
  selector: 'app-login',
  styleUrl: './login.css',
  templateUrl: './login.html',
})
export class Login {
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);
  readonly isSignUp = signal(false);
  readonly submitted = signal(false);
  readonly isSubmitting = signal(false);
  readonly errorMessage = signal('');
  readonly loginForm = new FormGroup({
    username: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    email: new FormControl('', { nonNullable: true }),
    password: new FormControl('', { nonNullable: true, validators: [Validators.required, Validators.minLength(6)] }),
    rememberMe: new FormControl(false, { nonNullable: true }),
  });

  toggleMode(): void {
    const nextMode = !this.isSignUp();
    this.isSignUp.set(nextMode);
    this.submitted.set(false);
    this.errorMessage.set('');

    if (nextMode) {
      this.loginForm.controls.email.setValidators([Validators.required, Validators.email]);
    } else {
      this.loginForm.controls.email.clearValidators();
    }
    this.loginForm.controls.email.updateValueAndValidity();
  }

  onSubmit(): void {
    this.submitted.set(true);
    this.errorMessage.set('');

    if (this.loginForm.invalid) return;

    this.isSubmitting.set(true);

    if (this.isSignUp()) {
      const { username, email, password } = this.loginForm.getRawValue();
      this.authService.register({ username, email, password }).subscribe({
        next: () => {
          this.isSubmitting.set(false);
          this.loginForm.markAsPristine();
          void this.router.navigate(['/dashboard']);
        },
        error: (error: { error?: { message?: string } | string; status?: number }) => {
          this.isSubmitting.set(false);
          const serverMsg = typeof error.error === 'object' ? error.error?.message : undefined;
          this.errorMessage.set(serverMsg ?? (error.status === 409 ? 'That username or email already exists.' : 'Unable to create account. Please try again.'));
        },
      });
    } else {
      const { username, password, rememberMe } = this.loginForm.getRawValue();
      this.authService.login({ username, password, rememberMe }).subscribe({
        next: () => {
          this.isSubmitting.set(false);
          this.loginForm.markAsPristine();
          void this.router.navigate(['/dashboard']);
        },
        error: (error: { error?: { message?: string } | string }) => {
          this.isSubmitting.set(false);
          const serverMsg = typeof error.error === 'object' ? error.error?.message : undefined;
          this.errorMessage.set(serverMsg ?? 'Unable to sign in. Please try again.');
        },
      });
    }
  }
}
