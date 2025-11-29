import {Injectable, signal} from '@angular/core';
import * as signalR from '@microsoft/signalr';
import {environment} from '../../../environments/environment';
import {TelemetryData} from '../../features/telemetry/telemetry-models/telemetry-models';

export interface ChartDataPoint {
  name: string;
  value: [string, number];
}

@Injectable({
  providedIn: 'root'
})
export class SignalrTelemetryService {
  private hubConnection?: signalR.HubConnection;

  private _telemetryFeed = signal<TelemetryData[]>([]);
  public connectionStatus = signal<string>('Disconnected');

  // KÖZPONTI HISTORY TÁROLÓ: Map<DeviceId, ArrayOfPoints>
  // Ez éli túl a navigációt.
  private deviceHistoryMap = new Map<number, ChartDataPoint[]>();

  get telemetryFeed() {
    return this._telemetryFeed;
  }

  // Publikus metódus, hogy a komponensek elkérhessék a history-t
  getDeviceHistory(deviceId: number): ChartDataPoint[] {
    return this.deviceHistoryMap.get(deviceId) || [];
  }

  init(): void {
    if (this.hubConnection) {
      return;
    }
    const hubUrl = environment.signalR.telemetryHubUrl.startsWith('http')
      ? environment.signalR.telemetryHubUrl
      : `${environment.apiBaseUrl}${environment.signalR.telemetryHubUrl}`;

    this.hubConnection = new signalR.HubConnectionBuilder()
      .withUrl(hubUrl)
      .withAutomaticReconnect()
      .configureLogging(signalR.LogLevel.Information)
      .build();

    // --- ESEMÉNYEK ---

    this.hubConnection.on('Connected', (connectionId: string) => {
      console.log('✅ SignalR connected. ID:', connectionId);
      this.connectionStatus.set('Online');
      this.hubConnection?.invoke('JoinGroup', 'MainGroup')
        .catch(err => console.error('JoinGroup error', err));
    });

    this.hubConnection.on('Disconnected', (connectionId: string) => {
      console.warn('⚠️ SignalR disconnected:', connectionId);
      this.connectionStatus.set('Offline');
    });

    this.hubConnection.onreconnecting(() => {
      console.log('🔄 SignalR reconnecting...');
      this.connectionStatus.set('Reconnecting...');
    });

    this.hubConnection.onreconnected((connectionId) => {
      console.log('✅ SignalR reconnected. ID:', connectionId);
      this.connectionStatus.set('Online');
      this.hubConnection?.invoke('JoinGroup', 'MainGroup');
    });

    // --- ADATFOGADÁS ---

    this.hubConnection.on('telemetryMessage', (data: TelemetryData) => {
      // 1. Frissítjük a Feed Signal-t (ez triggereli az effect-eket a komponensekben)
      this._telemetryFeed.update(current => {
        return [data, ...current].slice(0, 500);
      });

      // 2. Frissítjük a központi History-t a grafikonokhoz
      this.addToCentralHistory(data);
    });

    this.hubConnection.on('AcknowledgeHappened', () => {
      console.log('AcknowledgeHappened');
    });
  }

  private addToCentralHistory(data: TelemetryData) {
    const devId = data.id || 0;
    if (!this.deviceHistoryMap.has(devId)) {
      this.deviceHistoryMap.set(devId, []);
    }

    const history = this.deviceHistoryMap.get(devId)!;
    const timeStr = new Date(data.timeStamp).toLocaleTimeString();

    // ECharts formátum
    history.push({
      name: timeStr,
      value: [timeStr, Number(data.value)]
    });

    // Memória védelem: Max 50 pont / eszköz
    if (history.length > 50) {
      history.shift();
    }
  }

  async start(): Promise<void> {
    if (!this.hubConnection) {
      this.init();
    }

    if (this.hubConnection?.state === signalR.HubConnectionState.Disconnected) {
      this.connectionStatus.set('Connecting...');
      try {
        await this.hubConnection.start();
      } catch (err) {
        console.error('SignalR start error:', err);
        this.connectionStatus.set('Error');
      }
    }
  }

  async stop(): Promise<void> {
    if (this.hubConnection && this.hubConnection.state === signalR.HubConnectionState.Connected) {
      await this.hubConnection.stop();
      this.connectionStatus.set('Disconnected');
    }
  }
}
