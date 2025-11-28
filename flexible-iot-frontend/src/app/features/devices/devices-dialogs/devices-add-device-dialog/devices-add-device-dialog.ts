import {Component, inject, OnInit} from '@angular/core';
import {MAT_DIALOG_DATA, MatDialogModule} from '@angular/material/dialog';
import {MatFormFieldModule} from '@angular/material/form-field';
import {MatInputModule} from '@angular/material/input';
import {MatSelectModule} from '@angular/material/select';
import {MatButtonModule} from '@angular/material/button';
import {FormsModule} from '@angular/forms';
import {CreateDeviceRequest, DeviceItem} from '../../devices-models/devices-models';
import {AuthService} from '../../../auth/auth-api/auth-service';
import AdminService from '../../../admin/admin-api/admin-service';
import {AdminOrganizationItem, AdminUserItem} from '../../../admin/admin-models/admin-models';


// ITT A HIÁNYZÓ INTERFÉSZ DEFINÍCIÓ:
export interface DeviceDialogData {
  mode: 'create' | 'edit';
  device?: DeviceItem;
}

@Component({
  selector: 'app-devices-add-device-dialog',
  standalone: true,
  imports: [
    MatDialogModule, MatFormFieldModule, MatInputModule,
    MatSelectModule, MatButtonModule, FormsModule
  ],
  templateUrl: './devices-add-device-dialog.html',
  styleUrl: './devices-add-device-dialog.scss'
})
export class DevicesAddDeviceDialogComponent implements OnInit {
  private auth = inject(AuthService);
  private adminApi = inject(AdminService);

  data = inject<DeviceDialogData>(MAT_DIALOG_DATA);

  // Description törölve
  formData: CreateDeviceRequest = {
    name: '', topic: '', type: '', timeInterval: 60,
    companyName: null as any, ownerUserName: '', description: ''
  };

  isEdit = false;
  availableCompanies: AdminOrganizationItem[] = [];
  availableUsers: AdminUserItem[] = []; // Itt tároljuk a választható usereket

  canSelectCompany = false;
  canEditOwner = false;

  ngOnInit() {
    this.isEdit = this.data.mode === 'edit';
    this.setupPermissions();

    // Adatok betöltése
    this.loadCompaniesIfNeeded();
    this.loadUsersIfNeeded(); // <--- EZT HÍVJUK MEG

    if (this.isEdit && this.data.device) {
      const d = this.data.device;
      this.formData = {
        name: d.name, topic: d.topic, type: d.type,
        timeInterval: d.timeInterval,
        companyName: d.company || null as any,
        ownerUserName: d.ownerUserName,
        description: ''
      };
    } else {
      this.setDefaultsForCreate();
    }
  }

  private setupPermissions() {
    const isManager = this.auth.hasRole('Manager');
    // Manager és Admin is választhat céget/ownert (Admin csak a saját körében)
    this.canSelectCompany = isManager || this.auth.hasRole('Admin');
    this.canEditOwner = isManager || this.auth.hasRole('Admin');
  }

  private setDefaultsForCreate() {
    const myName = this.auth.userName() || '';
    const myCompany = this.auth.currentUserCompany();
    const isOperator = this.auth.hasRole('Operator');

    // Ha Operator hoz létre, akkor fixen ő a tulaj és nincs cég
    if (isOperator) {
      this.formData.ownerUserName = myName;
      this.formData.companyName = undefined;
    }

    // Ha Admin hoz létre, de nem választott mást, akkor ő a tulaj
    if (!this.formData.ownerUserName) {
      this.formData.ownerUserName = myName;
    }
  }

  private loadCompaniesIfNeeded() {
    if (this.canSelectCompany) {
      this.adminApi.getCompanies().subscribe(res => {
        if (this.auth.hasRole('Manager')) {
          this.availableCompanies = res;
        } else {
          // Admin csak a saját cégét látja
          const myComp = this.auth.currentUserCompany();
          this.availableCompanies = res.filter(c => c.name === myComp);
        }
      });
    }
  }

  private loadUsersIfNeeded() {
    if (this.canEditOwner) {
      this.adminApi.getUsers().subscribe(users => {
        // Szűrés: Admin csak a saját cége + individual usereket lássa
        if (this.auth.hasRole('Admin')) {
          const myComp = this.auth.currentUserCompany();
          this.availableUsers = users.filter(u =>
            u.organizationName === myComp || !u.organizationName
          );
        } else {
          // Manager mindenkiből választhat
          this.availableUsers = users;
        }
      });
    }
  }
}
