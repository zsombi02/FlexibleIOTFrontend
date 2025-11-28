import {Component, inject} from '@angular/core';
import {MAT_DIALOG_DATA, MatDialogModule} from '@angular/material/dialog';
import {MatFormFieldModule} from '@angular/material/form-field';
import {MatSelectModule} from '@angular/material/select';
import {MatButtonModule} from '@angular/material/button';
import {FormsModule} from '@angular/forms';
import {DeviceItem} from '../../../devices/devices-models/devices-models';
import {AdminOrganizationItem} from '../../admin-models/admin-models';

export interface AssignDeviceDialogData {
  device: DeviceItem;
  companies: AdminOrganizationItem[];
}

@Component({
  selector: 'app-admin-assign-device-dialog',
  imports: [
    MatDialogModule, MatFormFieldModule, MatSelectModule, MatButtonModule, FormsModule
  ],
  templateUrl: './admin-assign-device-dialog.html',
  styleUrl: './admin-assign-device-dialog.scss',
})
export class AdminAssignDeviceDialog {
  data = inject<AssignDeviceDialogData>(MAT_DIALOG_DATA);
  selectedCompany: string | null = null;

  constructor() {
    // Beállítjuk a jelenlegi céget alapértelmezettnek (ha van)
    // Ha 'null', akkor az az Individual opció
    this.selectedCompany = this.data.device.company || null;
  }
}
