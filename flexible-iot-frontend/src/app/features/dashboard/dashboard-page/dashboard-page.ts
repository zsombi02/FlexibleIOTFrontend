import {Component, computed, effect, inject, OnInit, signal} from '@angular/core';
import {BaseComponent} from '../../../core/base/base';
import {DashboardLiveFeedItem, DashboardStatCard} from '../dashboard-models/dashboard-models';
import {MatCardModule} from '@angular/material/card';
import {MatIconModule} from '@angular/material/icon'; // Ikonokhoz
import {SignalrTelemetryService} from '../../../core/realtime/signalr-telemetry-service';
import {DevicesService} from '../../devices/devices-api/devices-service';
import {AuthService} from '../../auth/auth-api/auth-service';
import {DeviceItem} from '../../devices/devices-models/devices-models';
import {CommonModule} from '@angular/common';
import {MatTabsModule} from '@angular/material/tabs';
import {EChartsOption} from 'echarts';
import {NgxEchartsDirective} from 'ngx-echarts';

@Component({
  selector: 'app-dashboard-page',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatTabsModule,
    MatIconModule,
    NgxEchartsDirective
  ],
  templateUrl: './dashboard-page.html',
  styleUrl: './dashboard-page.scss',
})
export class DashboardPage extends BaseComponent implements OnInit {
  pageTitle = 'Dashboard';

  private telemetry = inject(SignalrTelemetryService);
  private deviceApi = inject(DevicesService);
  private authService = inject(AuthService);

  connectionStatus = this.telemetry.connectionStatus;

  // Adatok
  myDevices = signal<DeviceItem[]>([]);
  liveFeedItems = signal<DashboardLiveFeedItem[]>([]);
  statCards = signal<DashboardStatCard[]>([]);

  systemInfoCards = signal([
    { title: 'CPU Terhelés', value: '42%', icon: 'memory', color: '#3f51b5' },
    { title: 'Memória', value: '1.2 GB', icon: 'storage', color: '#e91e63' },
    { title: 'Hálózat', value: '24 Mb/s', icon: 'router', color: '#009688' },
    { title: 'Szerver fut', value: '14n 2ó', icon: 'schedule', color: '#ff9800' }
  ]);

  // Chart logika
  selectedDeviceId = signal<number | null>(null);
  chartOption = signal<EChartsOption | null>(null);

  private deviceHistoryMap = new Map<number, { name: string, value: [string, number] }[]>();

  // LIVE DOT LOGIKA: Map<DeviceId, LastTimestamp>
  // Tároljuk, mikor jött utoljára adat az eszköztől
  private lastSeenMap = signal<Map<number, number>>(new Map());

  private deviceLookup = computed(() => {
    const map = new Map<number, DeviceItem>();
    this.myDevices().forEach(d => map.set(d.id, d));
    return map;
  });

  constructor() {
    super();

    effect(() => {
      const rawFeed = this.telemetry.telemetryFeed();
      const lookup = this.deviceLookup();
      const mappedFeed: DashboardLiveFeedItem[] = [];

      // Feldolgozzuk a legfrissebb adatot a chart-hoz és a Live Dot-hoz
      if (rawFeed.length > 0) {
        const latest = rawFeed[0];
        const devId = latest.id || 0;
        const device = lookup.get(devId);

        if (device) {
          // 1. Chart history frissítése
          this.addToHistory(devId, latest.timeStamp, Number(latest.value));

          // 2. LIVE DOT Frissítése: elmentjük a mostani időbélyeget
          this.updateLastSeen(devId);

          // 3. Ha ez a tab aktív, újrarajzoljuk a grafikont
          if (this.selectedDeviceId() === devId) {
            this.updateChartForDevice(devId);
          }
        }
      }

      // Feed generálás (jobb oldali sáv)
      for (const t of rawFeed) {
        const dev = lookup.get(t.id || 0);
        if (dev) {
          mappedFeed.push({
            id: `feed-${t.timeStamp}-${t.id}`,
            deviceName: dev.name,
            metricName: dev.type,
            value: t.value?.toString() ?? '0',
            unit: this.getUnitByType(dev.type),
            time: new Date(t.timeStamp).toLocaleTimeString()
          });
        }
      }
      this.liveFeedItems.set(mappedFeed);
      this.updateStats();
    });
  }

  ngOnInit() {
    this.initData();
    this.telemetry.start().catch(err => console.error(err));
  }

  // --- LIVE DOT HELPER ---
  // A template hívja meg: akkor "élő", ha az elmúlt 10 másodpercben jött adat
  isDeviceLive(devId: number): boolean {
    const lastSeen = this.lastSeenMap().get(devId);
    if (!lastSeen) return false;

    // Ha 10 másodpercen belüli az adat, akkor "zöld"
    return (Date.now() - lastSeen) < 10000;
  }

  private updateLastSeen(devId: number) {
    // Frissítjük a Map-et új referenciával, hogy a Signal érzékelje a változást a template-ben
    this.lastSeenMap.update(map => {
      const newMap = new Map(map);
      newMap.set(devId, Date.now());
      return newMap;
    });
  }

  private initData() {
    this.deviceApi.getAllDevices().subscribe({
      next: (devices) => {
        this.filterDevicesByRole(devices);
        // Alapból válasszuk ki az elsőt
        if (this.myDevices().length > 0) {
          this.selectedDeviceId.set(this.myDevices()[0].id);
          this.updateChartForDevice(this.myDevices()[0].id);
        }
      }
    });
  }

  onTabChange(index: number) {
    const devices = this.myDevices();
    if (devices[index]) {
      const devId = devices[index].id;
      this.selectedDeviceId.set(devId);
      this.updateChartForDevice(devId);
    }
  }

  private addToHistory(devId: number, time: string | Date, value: number) {
    if (!this.deviceHistoryMap.has(devId)) {
      this.deviceHistoryMap.set(devId, []);
    }
    const history = this.deviceHistoryMap.get(devId)!;
    const timeStr = new Date(time).toLocaleTimeString();
    history.push({ name: timeStr, value: [timeStr, value] });

    // Max 50 pont
    if (history.length > 50) history.shift();
  }

  private updateChartForDevice(devId: number) {
    const data = this.deviceHistoryMap.get(devId) || [];
    const device = this.deviceLookup().get(devId);
    if (!device) return;

    if (data.length === 0) {
      this.chartOption.set(null);
      return;
    }

    this.chartOption.set({
      title: {
        text: `${device.name} (${device.type})`,
        left: 'center',
        textStyle: { color: '#666', fontSize: 14 }
      },
      tooltip: {
        trigger: 'axis',
        formatter: (params: any) => {
          const pt = params[0];
          return `${pt.name} : ${pt.value[1]} ${this.getUnitByType(device.type)}`;
        }
      },
      xAxis: { type: 'category', boundaryGap: false },
      yAxis: { type: 'value', splitLine: { show: true, lineStyle: { type: 'dashed' } } },
      series: [{
        name: device.name,
        type: 'line',
        smooth: true,
        symbol: 'none',
        areaStyle: {
          color: {
            type: 'linear', x: 0, y: 0, x2: 0, y2: 1,
            colorStops: [{ offset: 0, color: 'rgba(63, 81, 181, 0.4)' }, { offset: 1, color: 'rgba(63, 81, 181, 0)' }]
          }
        },
        lineStyle: { width: 3, color: '#3f51b5' },
        data: data
      }],
      animationDuration: 500
    });
  }

  private filterDevicesByRole(devices: DeviceItem[]) {
    const isManager = this.authService.hasRole('Manager');
    const isAdmin = this.authService.hasRole('Admin');
    const myCompany = this.authService.currentUserCompany();
    const myUserName = this.authService.userName();

    let filtered: DeviceItem[] = [];
    if (isManager) filtered = devices;
    else if (isAdmin) filtered = devices.filter(d => (myCompany && d.company === myCompany) || d.ownerUserName === myUserName);
    else filtered = devices.filter(d => d.ownerUserName === myUserName);
    this.myDevices.set(filtered);
  }

  private updateStats() {
    this.statCards.set([
      { id: 'devs', title: 'Eszközök', value: this.myDevices().length.toString(), subtitle: 'Elérhető' },
      { id: 'status', title: 'Kapcsolat', value: this.connectionStatus(), subtitle: 'SignalR' }
    ]);
  }

  private getUnitByType(type: string): string {
    const t = type?.toLowerCase() || '';
    if (t.includes('temp')) return '°C';
    if (t.includes('hum')) return '%';
    if (t.includes('press')) return 'bar';
    if (t.includes('volt')) return 'V';
    return '';
  }
}
