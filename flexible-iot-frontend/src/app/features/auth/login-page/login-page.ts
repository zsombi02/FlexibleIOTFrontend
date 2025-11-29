import {Component, inject, OnInit, signal} from '@angular/core';

import {AuthService} from '../auth-api/auth-service';
import {Router} from '@angular/router';
import {LoginModel, RegisterModel} from '../auth-models/auth-models';
import {MatFormFieldModule} from '@angular/material/form-field';
import {FormsModule} from '@angular/forms';
import {MatCard, MatCardContent, MatCardHeader, MatCardTitle} from '@angular/material/card';
import {MatButton} from '@angular/material/button';
import {MatInput} from '@angular/material/input';
import {MatLineModule, MatOption} from '@angular/material/core';
import { MatSelectModule } from '@angular/material/select';
import {MatIconModule} from '@angular/material/icon';
import {MatSlideToggle} from '@angular/material/slide-toggle';
import AdminService from '../../admin/admin-api/admin-service';
import {AdminOrganizationItem} from '../../admin/admin-models/admin-models';
import {of, switchMap, throwError} from 'rxjs';

@Component({
  selector: 'app-login-page',
  imports: [
    MatFormFieldModule,
    FormsModule,
    MatCardContent,
    MatCardTitle,
    MatCardHeader,
    MatCard,
    MatButton,
    MatInput,
    MatLineModule,
    MatSelectModule,
    MatIconModule,
    MatSlideToggle,
    MatOption
  ],
  templateUrl: './login-page.html',
  styleUrl: './login-page.scss',
})
export class LoginPage  implements OnInit {
  private authService = inject(AuthService);
  private adminApi = inject(AdminService);
  private router = inject(Router);

  isLoginView = signal(true);
  isDemoRegistration = signal(false); // Demo mód kapcsoló

  loginModel = new LoginModel();
  registerModel = new RegisterModel();

  isLoading = signal(false);
  errorMessage = signal('');
  successMessage = signal('');

  availableRoles = ['Operator', 'Manager', 'Admin'];
  organizations = signal<AdminOrganizationItem[]>([]);

  ngOnInit() {
    this.loadCompanies();
  }

  loadCompanies() {
    this.adminApi.getCompanies().subscribe({
      next: (data) => this.organizations.set(data),
      error: (err) => console.warn('Company loading warning:', err)
    });
  }

  toggleView() {
    this.isLoginView.update(v => !v);
    this.errorMessage.set('');
    this.successMessage.set('');
    this.loginModel = new LoginModel();
    this.registerModel = new RegisterModel();
    this.isDemoRegistration.set(false);
    this.registerModel.role = 'Operator';
  }

  onLogin() {
    this.isLoading.set(true);
    this.errorMessage.set('');
    this.authService.login(this.loginModel).subscribe({
      next: () => {
        this.router.navigate(['/dashboard']);
      },
      error: (err) => {
        console.error(err);
        this.errorMessage.set('Incorrect Email or Password!');
        this.isLoading.set(false);
      }
    });
  }

  onRegister() {
    if (this.registerModel.password !== this.registerModel.confirmPassword) {
      this.errorMessage.set('The passwords do not match!');
      return;
    }

    if (!this.isDemoRegistration()) {
      this.registerModel.role = 'Operator';
      this.registerModel.organizationName = undefined;
    } else {
      if (this.registerModel.role !== 'Operator' && !this.registerModel.organizationName) {
        // TODO
      }
    }

    this.isLoading.set(true);
    this.errorMessage.set('');

    this.authService.register(this.registerModel).pipe(
      switchMap(() => {
        if (this.isDemoRegistration() && this.registerModel.organizationName) {

          return this.adminApi.getUsers().pipe(
            switchMap(users => {
              const newUser = users.find(u => u.email === this.registerModel.email);

              if (!newUser) {
                return throwError(() => 'User created, but ID lookup failed (cannot assign company).');
              }

              // ID megvan, mehet a hozzárendelés
              return this.adminApi.assignCompanyToUser(newUser.id, this.registerModel.organizationName!);
            })
          );
        }

        return of(null);
      })
    ).subscribe({
      next: () => {
        this.isLoading.set(false);
        this.successMessage.set('Successful Registration');
        this.loginModel.email = this.registerModel.email;
        this.isLoginView.set(true);
      },
      error: (err) => {
        console.error('Registration/Assignment error:', err);
        this.isLoading.set(false);

        // Hibakezelés
        if (typeof err === 'string') {
          this.errorMessage.set(err);
        } else if (Array.isArray(err.error)) {
          const messages = err.error.map((e: any) => e.description).join('\n');
          this.errorMessage.set(messages);
        } else if (err.error && typeof err.error === 'string') {
          this.errorMessage.set(err.error);
        } else {
          this.errorMessage.set('Error during registration process.');
        }
      }
    });
  }
}
