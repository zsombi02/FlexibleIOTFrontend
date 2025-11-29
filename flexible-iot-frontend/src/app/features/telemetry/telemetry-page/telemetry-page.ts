import {Component, inject, OnInit, signal} from '@angular/core';
import {CommonModule} from '@angular/common';
import {MatButtonModule} from '@angular/material/button';
import {MatIconModule} from '@angular/material/icon';
import {AuthService} from '../../auth/auth-api/auth-service';
import {TelemetryWidgetConfig} from '../telemetry-models/telemetry-models';
import {TelemetryWidget} from '../telemetry-widgets/telemetry-widget/telemetry-widget';
import {DeviceAccessFacade} from '../../../core/base/devices-access-facade';

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
  private facade = inject(DeviceAccessFacade); // Új

  availableDevices = this.facade.devices;

  widgets = signal<TelemetryWidgetConfig[]>([]);

  ngOnInit() {
    this.facade.loadDevices();

    this.addWidget();
  }

  addWidget() {
    this.widgets.update(list => [
      ...list,
      {
        uuid: crypto.randomUUID(),
        chartType: 'area',
        dateFrom: null,
        dateTo: null
      }
    ]);
  }

  removeWidget(uuid: string) {
    this.widgets.update(list => list.filter(w => w.uuid !== uuid));
  }

}
