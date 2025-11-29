import {Component, inject, OnInit, signal} from '@angular/core';

import {MatCardModule} from '@angular/material/card';
import {MatButtonModule} from '@angular/material/button';
import {MatIconModule} from '@angular/material/icon';
import {RouterLink} from '@angular/router';
import {DevicesService} from '../devices-api/devices-service';
import {DeviceItem, CreateDeviceRequest} from '../devices-models/devices-models';
import {AuthService} from '../../auth/auth-api/auth-service';
import {MatDialog} from '@angular/material/dialog';
import {MatTableModule} from '@angular/material/table';
import {DevicesAddDeviceDialogComponent} from '../devices-dialogs/devices-add-device-dialog/devices-add-device-dialog';
import {DeviceAccessFacade} from '../../../core/base/devices-access-facade';

@Component({
  selector: 'app-devices-page',
  standalone: true,
  imports: [
    MatCardModule, MatButtonModule, MatIconModule, RouterLink, MatTableModule
  ],
  templateUrl: './devices-page.html',
  styleUrl: './devices-page.scss'
})
export class DevicesPage  implements OnInit {
  pageTitle = 'Devices';

  private api = inject(DevicesService);
  protected auth = inject(AuthService);
  private dialog = inject(MatDialog);

  protected facade = inject(DeviceAccessFacade);

  devices = this.facade.devices;

  displayedColumns: string[] = ['id', 'name', 'type', 'company', 'owner', 'actions'];

  ngOnInit() {
    this.facade.loadDevices();
  }

  openCreateDialog() {
    const dialogRef = this.dialog.open(DevicesAddDeviceDialogComponent, {
      width: '500px', data: { mode: 'create' }
    });
    dialogRef.afterClosed().subscribe((res: CreateDeviceRequest) => {
      if (res) this.api.createDevice(res).subscribe(() => this.facade.loadDevices());
    });
  }

  openEditDialog(dev: DeviceItem, event: Event) {
    event.stopPropagation();
    const dialogRef = this.dialog.open(DevicesAddDeviceDialogComponent, {
      width: '500px', data: { mode: 'edit', device: dev }
    });
    dialogRef.afterClosed().subscribe((res: CreateDeviceRequest) => {
      if (res) this.api.updateDevice(dev.id, res).subscribe(() => this.facade.loadDevices());
    });
  }

  deleteDevice(dev: DeviceItem, event: Event) {
    event.stopPropagation();
    if(confirm(`Törlöd a(z) ${dev.name} eszközt?`)) {
      this.api.deleteDevice(dev.id).subscribe(() => this.facade.loadDevices());
    }
  }

  canEdit(dev: DeviceItem): boolean {
    if (this.auth.hasRole('Manager')) return true;
    const myName = this.auth.userName();
    const myCompany = this.auth.currentUserCompany();

    if (this.auth.hasRole('Operator')) return dev.ownerUserName === myName;

    if (this.auth.hasRole('Admin')) {
      return (myCompany && dev.company === myCompany) || dev.ownerUserName === myName;
    }
    return false;
  }
}
