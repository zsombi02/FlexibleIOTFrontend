import { Component } from '@angular/core';
import { MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { FormsModule } from '@angular/forms';
import {CreateUserRequest} from '../../admin-models/admin-models';

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
  data: CreateUserRequest = {
    email: '',
    password: '',
    confirmPassword: '',
    role: 'User'
  };
}
