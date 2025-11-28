import {Component, inject, OnInit, signal} from '@angular/core';
import {BaseComponent} from '../../../core/base/base';
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


@Component({
  selector: 'app-devices-page',
  standalone: true,
  imports: [
    MatCardModule, MatButtonModule, MatIconModule, RouterLink, MatTableModule
  ],
  templateUrl: './devices-page.html',
  styleUrl: './devices-page.scss'
})
export class DevicesPage extends BaseComponent implements OnInit {
  pageTitle = 'Eszközök';

  private api = inject(DevicesService);
  protected auth = inject(AuthService);
  private dialog = inject(MatDialog);

  devices = signal<DeviceItem[]>([]);
  displayedColumns: string[] = ['id', 'name', 'type', 'company', 'owner', 'actions'];

  ngOnInit() {
    this.loadDevices();
  }

  loadDevices() {
    this.api.getAllDevices().subscribe(all => {
      this.filterDevices(all);
    });
  }

  private filterDevices(all: DeviceItem[]) {
    const isManager = this.auth.hasRole('Manager');
    const isAdmin = this.auth.hasRole('Admin');
    const myCompany = this.auth.currentUserCompany();
    const myName = this.auth.userName();

    let filtered: DeviceItem[] = [];

    if (isManager) {
      filtered = all;
    } else if (isAdmin) {
      filtered = all.filter(d =>
        (myCompany && d.company === myCompany) ||
        d.ownerUserName === myName
      );
    } else {
      filtered = all.filter(d =>
        d.ownerUserName === myName ||
        (myCompany && d.company === myCompany)
      );
    }
    this.devices.set(filtered);
  }

  openCreateDialog() {
    // ITT A JAVÍTOTT NEVŰ KOMPONENS
    const dialogRef = this.dialog.open(DevicesAddDeviceDialogComponent, {
      width: '500px', data: { mode: 'create' }
    });
    dialogRef.afterClosed().subscribe((res: CreateDeviceRequest) => {
      if (res) this.api.createDevice(res).subscribe(() => this.loadDevices());
    });
  }

  openEditDialog(dev: DeviceItem, event: Event) {
    event.stopPropagation();
    const dialogRef = this.dialog.open(DevicesAddDeviceDialogComponent, {
      width: '500px', data: { mode: 'edit', device: dev }
    });
    dialogRef.afterClosed().subscribe((res: CreateDeviceRequest) => {
      if (res) this.api.updateDevice(dev.id, res).subscribe(() => this.loadDevices());
    });
  }

  deleteDevice(dev: DeviceItem, event: Event) {
    event.stopPropagation();
    if(confirm(`Törlöd a(z) ${dev.name} eszközt?`)) {
      this.api.deleteDevice(dev.id).subscribe(() => this.loadDevices());
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
