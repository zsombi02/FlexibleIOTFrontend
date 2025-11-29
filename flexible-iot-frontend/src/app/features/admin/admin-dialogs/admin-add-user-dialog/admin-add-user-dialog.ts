import {Component, inject, signal} from '@angular/core';
import {MatDialogModule, MatDialogRef} from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { FormsModule } from '@angular/forms';
import {CreateUserRequest} from '../../admin-models/admin-models';
import AdminService from '../../admin-api/admin-service';

@Component({
  selector: 'app-admin-add-user-dialog',
  imports: [
    MatDialogModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    FormsModule
  ],
  templateUrl: './admin-add-user-dialog.html',
  styleUrl: './admin-add-user-dialog.scss'
})
export class AdminAddUserDialogComponent {
  private adminApi = inject(AdminService);
  private dialogRef = inject(MatDialogRef<AdminAddUserDialogComponent>);

  data: CreateUserRequest = {
    email: '',
    password: '',
    confirmPassword: '',
    role: 'Operator'
  };

  isLoading = signal(false);
  errorMessage = signal('');

  availableRoles = ['Operator', 'Manager', 'Admin'];

  onSave() {
    // Kliens oldali validáció
    if (this.data.password !== this.data.confirmPassword) {
      this.errorMessage.set('The passwords do not match!');
      return;
    }

    this.isLoading.set(true);
    this.errorMessage.set('');

    // API hívás a DIALOGON BELÜL
    this.adminApi.createUser(this.data).subscribe({
      next: () => {
        this.isLoading.set(false);
        // Siker: Bezárjuk a dialogot és visszaadjuk az adatokat (hogy a szülő tudja, ki lett létrehozva)
        this.dialogRef.close(this.data);
      },
      error: (err) => {
        this.isLoading.set(false);
        console.error('User creation error:', err);

        // Ugyanaz a hibaüzenet logika, mint a Login oldalon
        if (Array.isArray(err.error)) {
          const messages = err.error.map((e: any) => e.description).join('\n');
          this.errorMessage.set(messages);
        } else if (err.error && typeof err.error === 'string') {
          this.errorMessage.set(err.error);
        } else {
          this.errorMessage.set(err.message || 'Failed to create user.');
        }

      }
    });
  }

  onCancel() {
    this.dialogRef.close();
  }
}
