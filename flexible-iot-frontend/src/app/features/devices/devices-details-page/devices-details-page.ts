import {Component, signal} from '@angular/core';
import {BaseComponent} from '../../../core/base/base';
import {DeviceDetailsOverview, DeviceHistorySummary, DeviceLiveMetric} from '../devices-models/devices-models';
import {ActivatedRoute} from '@angular/router';
import {MatCard, MatCardContent, MatCardTitle} from '@angular/material/card';

@Component({
  selector: 'app-devices-details-page',
  imports: [
    MatCard,
    MatCardTitle,
    MatCardContent
  ],
  templateUrl: './devices-details-page.html',
  styleUrl: './devices-details-page.scss',
})
export class DevicesDetailsPage extends BaseComponent {
  pageTitle = 'Device details';

  deviceId = signal<string>('');
  overview = signal<DeviceDetailsOverview | null>(null);
  liveMetrics = signal<DeviceLiveMetric[]>([]);
  historySummary = signal<DeviceHistorySummary | null>(null);

  constructor(private route: ActivatedRoute) {
    super();
    this.initFromRoute();
    this.initPlaceholderData();
  }

  private initFromRoute(): void {
    const id = this.route.snapshot.paramMap.get('id') ?? '';
    this.deviceId.set(id);
  }

  private initPlaceholderData(): void {
    // Ez később REST + SignalR kombó lesz
    this.overview.set({
      id: this.deviceId() || 'dev-001',
      name: 'ESP-Room-201',
      type: 'ESP32',
      status: 'online',
      company: 'Acme Ltd.',
      location: 'Office / Room 201',
      firmwareVersion: '1.2.3',
      registeredAt: '2025-10-01 09:15',
    });

    this.liveMetrics.set([
      {
        id: 'temp',
        key: 'temperature',
        label: 'Temperature',
        value: '22.8',
        unit: '°C',
        updatedAt: 'just now',
      },
      {
        id: 'hum',
        key: 'humidity',
        label: 'Humidity',
        value: '46',
        unit: '%',
        updatedAt: 'just now',
      },
      {
        id: 'volt',
        key: 'voltage',
        label: 'Voltage',
        value: '3.29',
        unit: 'V',
        updatedAt: 'just now',
      },
    ]);

    this.historySummary.set({
      metricKey: 'temperature',
      metricLabel: 'Temperature',
      timeWindowLabel: 'Last 24 hours',
      placeholderText: 'Historical chart placeholder',
    });
  }
}
