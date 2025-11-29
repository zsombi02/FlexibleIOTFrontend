import { Component, inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { FormsModule } from '@angular/forms';
import {AdminOrganizationItem, AdminUserItem} from '../../admin-models/admin-models';

export interface AssignCompanyDialogData {
  user: AdminUserItem;
  companies: AdminOrganizationItem[];
}

@Component({
  selector: 'app-admin-assign-company-dialog',
  imports: [
    MatDialogModule,
    MatFormFieldModule,
    MatSelectModule,
    MatButtonModule,
    FormsModule
  ],
  templateUrl: './admin-assign-company-dialog.html',
  styleUrl: './admin-assign-company-dialog.scss'
})
export class AdminAssignCompanyDialogComponent {
  data = inject<AssignCompanyDialogData>(MAT_DIALOG_DATA);

  selectedCompany = '';
}
