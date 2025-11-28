import {Component, inject, OnInit, signal} from '@angular/core';
import {CommonModule} from '@angular/common';
import {MatButtonModule} from '@angular/material/button';
import {MatIconModule} from '@angular/material/icon';
import {AuthService} from '../../auth/auth-api/auth-service';
import {DevicesService} from '../../devices/devices-api/devices-service';
import {DeviceItem} from '../../devices/devices-models/devices-models';
import {TelemetryWidgetConfig} from '../telemetry-models/telemetry-models';
import {TelemetryWidget} from '../telemetry-widgets/telemetry-widget/telemetry-widget';

@Component({
  selector: 'app-telemetry-page',
  standalone: true,
  imports: [
    CommonModule, MatButtonModule, MatIconModule,
    TelemetryWidget
  ],
  templateUrl: './telemetry-page.html',
  styleUrl: './telemetry-page.scss'
})
export class TelemetryPage implements OnInit {
  private auth = inject(AuthService);
  private devicesApi = inject(DevicesService);

  // A felhasználó által látható eszközök
  availableDevices = signal<DeviceItem[]>([]);

  // A widgetek dinamikus listája
  widgets = signal<TelemetryWidgetConfig[]>([]);

  ngOnInit() {
    this.loadDevices();
    // Alapból adunk egy üres kártyát, hogy ne legyen üres a képernyő
    this.addWidget();
  }

  addWidget() {
    this.widgets.update(list => [
      ...list,
      {
        uuid: crypto.randomUUID(), // Egyedi ID a trackBy-hoz
        chartType: 'area', // Alapértelmezett
        dateFrom: null,
        dateTo: null
      }
    ]);
  }

  removeWidget(uuid: string) {
    this.widgets.update(list => list.filter(w => w.uuid !== uuid));
  }

  // --- DEVICE BETÖLTÉS & SZŰRÉS (Ugyanaz a logika, mint máshol) ---
  private loadDevices() {
    this.devicesApi.getAllDevices().subscribe(all => {
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
        (myCompany && d.company === myCompany) || d.ownerUserName === myName
      );
    } else {
      // Operator
      filtered = all.filter(d => d.ownerUserName === myName);
    }
    this.availableDevices.set(filtered);
  }
}
