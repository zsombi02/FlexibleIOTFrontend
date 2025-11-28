import {Component, inject, signal} from '@angular/core';
import {BaseComponent} from '../../../core/base/base';
import {AuthService} from '../auth-api/auth-service';
import {Router} from '@angular/router';
import {LoginModel} from '../auth-models/auth-models';
import {MatFormFieldModule} from '@angular/material/form-field';
import {FormsModule} from '@angular/forms';
import {MatCard, MatCardContent, MatCardHeader, MatCardTitle} from '@angular/material/card';
import {MatButton} from '@angular/material/button';
import {MatInput} from '@angular/material/input';

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
    MatInput
  ],
  templateUrl: './login-page.html',
  styleUrl: './login-page.scss',
})
export class LoginPage extends BaseComponent {
  private authService = inject(AuthService);
  private router = inject(Router);

  model = new LoginModel();
  isLoading = signal(false);
  errorMessage = signal('');

  onSubmit() {
    this.isLoading.set(true);
    this.errorMessage.set('');
    this.authService.login(this.model).subscribe({
      next: () => {
        // Sikeres login után irány a dashboard
        this.router.navigate(['/dashboard']);
      },
      error: (err) => {
        console.error(err);
        this.errorMessage.set('Helytelen email vagy jelszó!');
        this.isLoading.set(false);
      }
    });
  }
}
