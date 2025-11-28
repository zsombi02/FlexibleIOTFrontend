import {Injectable, signal} from '@angular/core';
import * as signalR from '@microsoft/signalr';
import {environment} from '../../../environments/environment';
import {TelemetryData} from '../../features/telemetry/telemetry-models/telemetry-models';

@Injectable({
  providedIn: 'root'
})
export class SignalrTelemetryService {
  private hubConnection?: signalR.HubConnection;

  private _telemetryFeed = signal<TelemetryData[]>([]);

  public connectionStatus = signal<string>('Disconnected');

  get telemetryFeed() {
    return this._telemetryFeed;
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
      .withAutomaticReconnect() // Ez nagyon fontos!
      .configureLogging(signalR.LogLevel.Information)
      .build();

    // --- ESEMÉNYEK ---

    this.hubConnection.on('Connected', (connectionId: string) => {
      console.log('✅ SignalR connected. ID:', connectionId);
      this.connectionStatus.set('Online');

      // FONTOS: Olyan csoportba lépj be, ahova a backend küld!
      // A backend kód alapján a "MainGroup" tűnik logikusnak a broadcastra
      this.hubConnection?.invoke('JoinGroup', 'MainGroup')
        .catch(err => console.error('JoinGroup error', err));
    });

    this.hubConnection.on('Disconnected', (connectionId: string) => {
      console.warn('⚠️ SignalR disconnected:', connectionId);
      this.connectionStatus.set('Offline');
    });

    // RECONNECT ESEMÉNYEK (hogy látszódjon a UI-on ha baj van)
    this.hubConnection.onreconnecting(() => {
      console.log('🔄 SignalR reconnecting...');
      this.connectionStatus.set('Reconnecting...');
    });

    this.hubConnection.onreconnected((connectionId) => {
      console.log('✅ SignalR reconnected. ID:', connectionId);
      this.connectionStatus.set('Online');
      // Újracsatlakozáskor újra be kell lépni a csoportba!
      this.hubConnection?.invoke('JoinGroup', 'MainGroup');
    });

    // --- ADATFOGADÁS ---

    this.hubConnection.on('telemetryMessage', (data: TelemetryData) => {
      console.log('TelemetryMessage:', data);

      this._telemetryFeed.update(current => {
        // Új adat az elejére, maximum 50-et tartunk meg a memóriában
        return [data, ...current].slice(0, 500);
      });
    });

    this.hubConnection.on('AcknowledgeHappened', () => {
      console.log('AcknowledgeHappened');
    });
  }

  async start(): Promise<void> {
    if (!this.hubConnection) {
      this.init();
    }

    if (this.hubConnection?.state === signalR.HubConnectionState.Disconnected) {
      this.connectionStatus.set('Connecting...');
      try {
        await this.hubConnection.start();
        // A 'Connected' esemény majd beállítja az 'Online'-t
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
