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

  private readonly MAX_DEVICE_HISTORY = 50;
  private readonly MAX_GLOBAL_FEED_LENGTH = 100;

  private _telemetryFeed = signal<TelemetryData[]>([]);
  public connectionStatus = signal<string>('Disconnected');

  private deviceHistoryMap = new Map<number, ChartDataPoint[]>();

  get telemetryFeed() {
    return this._telemetryFeed;
  }

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
      // 1. Frissítjük a Feed Signal-t (ez a jobb oldali lista)
      // Itt a slice biztosítja, hogy a globális lista ne nőjön túl nagyra
      this._telemetryFeed.update(current => {
        return [data, ...current].slice(0, this.MAX_GLOBAL_FEED_LENGTH);
      });

      // 2. Frissítjük a központi History-t a grafikonokhoz (szigorú id-nkénti limit)
      this.addToCentralHistory(data);
    });

    this.hubConnection.on('AcknowledgeHappened', () => {
      console.log('AcknowledgeHappened');
    });
  }

  private addToCentralHistory(data: TelemetryData) {
    const devId = data.id || 0;

    // Ha még nincs ilyen eszköz a map-ben, létrehozzuk
    if (!this.deviceHistoryMap.has(devId)) {
      this.deviceHistoryMap.set(devId, []);
    }

    const history = this.deviceHistoryMap.get(devId)!;
    const timeStr = new Date(data.timeStamp).toLocaleTimeString();

    // Új pont hozzáadása
    history.push({
      name: timeStr,
      value: [timeStr, Number(data.value)]
    });

    // MEMÓRIA VÉDELEM: Ha túlléptük a limitet, a legrégebbit (tömb eleje) kidobjuk
    while (history.length > this.MAX_DEVICE_HISTORY) {
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
