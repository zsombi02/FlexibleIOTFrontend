import {Component, effect, inject, OnInit, signal} from '@angular/core';
import {BaseComponent} from '../../../core/base/base';
import {ActivatedRoute} from '@angular/router';
import {MatCardModule} from '@angular/material/card';
import {CommonModule} from '@angular/common';
import {DeviceDetails} from '../devices-models/devices-models';
import {DevicesService} from '../devices-api/devices-service';
import {SignalrTelemetryService} from '../../../core/realtime/signalr-telemetry-service';
import {EChartsOption} from 'echarts';
import {NgxEchartsDirective} from 'ngx-echarts';
import AdminService from '../../admin/admin-api/admin-service';
import {AdminUserItem} from '../../admin/admin-models/admin-models';

@Component({
  selector: 'app-devices-details-page',
  standalone: true,
  imports: [MatCardModule, CommonModule, NgxEchartsDirective],
  templateUrl: './devices-details-page.html',
  styleUrl: './devices-details-page.scss',
})
export class DevicesDetailsPage extends BaseComponent implements OnInit {
  pageTitle = 'Device details';

  private route = inject(ActivatedRoute);
  private api = inject(DevicesService);
  private adminApi = inject(AdminService); // <--- Kell a user infókhoz
  private telemetry = inject(SignalrTelemetryService);

  deviceId = signal<number>(0);
  device = signal<DeviceDetails | null>(null);

  // OWNER RÉSZLETEK
  ownerDetails = signal<AdminUserItem | null>(null);

  lastValue = signal<string>('---');
  lastUpdated = signal<string>('');

  chartOption = signal<EChartsOption | null>(null);
  private history: {name: string, value: [string, number]}[] = [];

  constructor() {
    super();
    effect(() => {
      const feed = this.telemetry.telemetryFeed();
      const currentId = this.deviceId();

      if (feed.length > 0 && currentId > 0) {
        const myData = feed.find(d => (d.id) === currentId);
        if (myData) {
          this.updateLiveData(myData.value, myData.timeStamp);
        }
      }
    });
  }

  ngOnInit() {
    const idParam = this.route.snapshot.paramMap.get('id');
    if (idParam) {
      this.deviceId.set(Number(idParam));
      this.loadDetails();
    }
    this.telemetry.start();
  }

  loadDetails() {
    // 1. Betöltjük az eszközt
    this.api.getDeviceById(this.deviceId()).subscribe(d => {
      this.device.set(d);
      this.pageTitle = d.name;

      // 2. HA megvan az eszköz, megkeressük a tulajdonost a user listában
      if (d.ownerUserName) {
        this.loadOwnerDetails(d.ownerUserName);
      }
    });
  }

  private loadOwnerDetails(email: string) {
    // Egyszerű megoldás: lekérjük a usereket és szűrünk.
    // (Ideális esetben lenne getProfileByEmail végpont, de ez is jó)
    this.adminApi.getUsers().subscribe(users => {
      const owner = users.find(u => u.email === email || u.name === email);
      if (owner) {
        this.ownerDetails.set(owner);
      }
    });
  }

  private updateLiveData(value: any, time: string | Date) {
    const valStr = value.toString();
    const timeStr = new Date(time).toLocaleTimeString();

    this.lastValue.set(valStr);
    this.lastUpdated.set(timeStr);

    this.history.push({
      name: timeStr,
      value: [timeStr, Number(value)]
    });
    if (this.history.length > 50) this.history.shift();

    this.updateChart();
  }

  private updateChart() {
    this.chartOption.set({
      tooltip: { trigger: 'axis' },
      xAxis: { type: 'category', boundaryGap: false },
      yAxis: { type: 'value', splitLine: { show: true, lineStyle: { type: 'dashed' } } },
      series: [{
        type: 'line',
        smooth: true,
        areaStyle: { opacity: 0.3 },
        data: [...this.history],
        animation: false
      }],
      grid: { left: 40, right: 20, top: 20, bottom: 20 }
    });
  }
}
