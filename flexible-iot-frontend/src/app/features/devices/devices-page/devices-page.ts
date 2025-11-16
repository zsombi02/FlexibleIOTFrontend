import {Component, signal} from '@angular/core';
import {BaseComponent} from '../../../core/base/base';
import {DeviceListItem} from '../devices-models/devices-models';
import {MatIconModule} from '@angular/material/icon';
import {MatCard, MatCardContent, MatCardTitle} from '@angular/material/card';
import {RouterLink} from '@angular/router';
import {MatButton} from '@angular/material/button';

@Component({
  selector: 'app-devices-page',
  imports: [
    MatIconModule,
    MatCardContent,
    MatCardTitle,
    MatCard,
    RouterLink,
    MatButton
  ],
  templateUrl: './devices-page.html',
  styleUrl: './devices-page.scss',
})
export class DevicesPage extends BaseComponent {
  pageTitle = 'Devices';

  // majd kötöd search inputhoz / filterhez
  filterText = signal('');

  devices = signal<DeviceListItem[]>([]);

  constructor() {
    super();
    this.initPlaceholderData();
  }

  private initPlaceholderData(): void {
    this.devices.set([
      {
        id: 'dev-001',
        name: 'ESP-Room-201',
        type: 'ESP32',
        status: 'online',
        lastSeen: '2025-10-17 18:12',
        company: 'Acme Ltd.',
        location: 'Office / Room 201',
      },
      {
        id: 'dev-002',
        name: 'ESP-Lab-02',
        type: 'ESP8266',
        status: 'online',
        lastSeen: '2025-10-17 18:11',
        company: 'Acme Ltd.',
        location: 'Lab 02',
      },
      {
        id: 'dev-003',
        name: 'ESP-WH-01',
        type: 'ESP32',
        status: 'offline',
        lastSeen: '2025-10-17 17:45',
        company: 'Ware Inc.',
        location: 'Warehouse',
      },
    ]);
  }
}
