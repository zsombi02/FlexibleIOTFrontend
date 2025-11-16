import {Component, signal} from '@angular/core';
import {BaseComponent} from '../../../core/base/base';
import {
  DashboardLiveFeedItem, DashboardStatCard,
  DashboardTelemetryCard,
  DashboardTopDevice
} from '../dashboard-models/dashboard-models';
import {MatCardModule} from '@angular/material/card';

@Component({
  selector: 'app-dashboard-page',
  imports: [
    MatCardModule
  ],
  templateUrl: './dashboard-page.html',
  styleUrl: './dashboard-page.scss',
})
export class DashboardPage extends BaseComponent {
  pageTitle = 'Dashboard';

  connectionStatus = signal('Online');
  timeWindowLabel = signal('Időablak: 1 óra');

  statCards = signal<DashboardStatCard[]>([]);
  telemetryCard = signal<DashboardTelemetryCard | null>(null);
  liveFeedItems = signal<DashboardLiveFeedItem[]>([]);
  topDevices = signal<DashboardTopDevice[]>([]);

  constructor() {
    super();
    this.initPlaceholderData();
  }

  private initPlaceholderData(): void {
    this.statCards.set([
      {
        id: 'total-devices',
        title: 'Összes eszköz',
        value: '128',
        subtitle: 'Regisztrált'
      },
      {
        id: 'active-devices',
        title: 'Aktív eszközök',
        value: '91',
        subtitle: 'Jelenleg online'
      },
      {
        id: 'last-telemetry',
        title: 'Utolsó telemetria',
        value: '2025-10-17 18:12',
        subtitle: 'ESP-Room-201'
      },
      {
        id: 'error-rate',
        title: 'Hiba arány',
        value: '3.4%',
        subtitle: 'Utóbbi 1h'
      }
    ]);

    this.telemetryCard.set({
      title: 'Telemetria – Hisztogram / Idősor',
      selectedMetricLabel: 'adatkulcs:',
      selectedMetricKey: 'temperature',
      metricOptions: ['temperature', 'humidity', 'voltage'],
      modeLabel: 'Hisztogram',
      placeholderText: 'Grafikon helye (mock)'
    });

    this.liveFeedItems.set([
      {
        id: 'feed-1',
        deviceName: 'ESP-Room-201',
        metricName: 'temperature',
        value: '22.8',
        unit: '°C',
        time: '18:12'
      },
      {
        id: 'feed-2',
        deviceName: 'ESP-Lab-02',
        metricName: 'humidity',
        value: '46',
        unit: '%',
        time: '18:12'
      },
      {
        id: 'feed-3',
        deviceName: 'ESP-WH-01',
        metricName: 'voltage',
        value: '3.29',
        unit: 'V',
        time: '18:11'
      }
    ]);

    this.topDevices.set([
      {
        id: 'top-1',
        deviceName: 'ESP-Room-201',
        company: 'Acme Ltd.',
        messagesLabel: 'Üzenetek',
        messagesCount: 1240
      },
      {
        id: 'top-2',
        deviceName: 'ESP-Lab-02',
        company: 'Acme Ltd.',
        messagesLabel: 'Üzenetek',
        messagesCount: 988
      },
      {
        id: 'top-3',
        deviceName: 'ESP-WH-01',
        company: 'Ware Inc.',
        messagesLabel: 'Üzenetek',
        messagesCount: 803
      }
    ]);
  }
}
