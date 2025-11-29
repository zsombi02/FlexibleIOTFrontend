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
import {AdminUserItem} from '../../../admin/admin-models/admin-models';

export interface DeviceDialogData {
  mode: 'create' | 'edit';
  device?: DeviceItem;
}

// Segéd interfész a típusokhoz
interface DeviceTypeOption {
  label: string;
  value: string;
  unitHint: string;
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

  formData: CreateDeviceRequest = {
    name: '', topic: '', type: '', timeInterval: 60,
    companyName: null as any, ownerUserName: '', description: ''
  };

  isEdit = false;
  availableUsers: AdminUserItem[] = [];
  canEditOwner = false;

  deviceTypes: DeviceTypeOption[] = [
    { label: 'Temperature Sensor', value: 'Temperature Sensor', unitHint: '°C' },
    { label: 'Humidity Sensor', value: 'Humidity Sensor', unitHint: '%' },
    { label: 'Pressure Sensor', value: 'Pressure Sensor', unitHint: 'bar' },
    { label: 'Voltage Sensor', value: 'Voltage Sensor', unitHint: 'V' },
    { label: 'Current (Amperage)', value: 'Amperage Sensor', unitHint: 'A' },
    { label: 'Power Meter', value: 'Power Meter', unitHint: 'W' },
    { label: 'Speed Sensor', value: 'Speed Sensor', unitHint: 'km/h' },
    { label: 'Vibration Sensor', value: 'Vibration Sensor', unitHint: 'Hz' },
    { label: 'Tank Level', value: 'Tank Level', unitHint: '%' },
    { label: 'Counter', value: 'Item Counter', unitHint: 'db' },
    { label: 'Other / Generic', value: 'Generic Sensor', unitHint: '-' }
  ];

  ngOnInit() {
    this.isEdit = this.data.mode === 'edit';
    this.setupPermissions();
    this.loadUsersIfNeeded();

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
    this.canEditOwner = isManager || this.auth.hasRole('Admin');
  }

  private setDefaultsForCreate() {
    const myName = this.auth.userName() || '';
    this.formData.companyName = undefined;

    this.formData.type = this.deviceTypes[0].value;

    if (!this.formData.ownerUserName) {
      this.formData.ownerUserName = myName;
    }
  }

  private loadUsersIfNeeded() {
    if (this.canEditOwner) {
      this.adminApi.getUsers().subscribe(users => {
        if (this.auth.hasRole('Admin')) {
          const myComp = this.auth.currentUserCompany();
          this.availableUsers = users.filter(u =>
            u.organizationName === myComp || !u.organizationName
          );
        } else {
          this.availableUsers = users;
        }
      });
    }
  }
}
