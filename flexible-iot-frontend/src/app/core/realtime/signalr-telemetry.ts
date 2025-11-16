import { Injectable } from '@angular/core';
import * as signalR from '@microsoft/signalr';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class SignalrTelemetry {

  private hubConnection?: signalR.HubConnection;

  constructor() { }

  init(): void {
    this.hubConnection = new signalR.HubConnectionBuilder()
      .withUrl(environment.signalR.telemetryHubUrl)
      .withAutomaticReconnect()
      .build();

    // később:
    // this.hubConnection.on('TelemetryUpdate', data => { ... });
  }

  start(): Promise<void> {
    return this.hubConnection?.start() ?? Promise.resolve();
  }

  stop(): Promise<void> {
    return this.hubConnection?.stop() ?? Promise.resolve();
  }
}
