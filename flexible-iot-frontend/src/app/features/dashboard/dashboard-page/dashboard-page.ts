import {Component, computed, effect, inject, OnDestroy, OnInit, signal} from '@angular/core';
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
import {FormsModule} from '@angular/forms';
import {MatSnackBar} from '@angular/material/snack-bar';
import {SimulationService} from '../dashboard-api/simulation-service';
import {MatFormField} from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import {MatSlideToggle} from '@angular/material/slide-toggle';
import {MatSelectModule} from '@angular/material/select';
import {MatButton} from '@angular/material/button';



@Component({
  selector: 'app-dashboard-page',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatTabsModule,
    MatIconModule,
    NgxEchartsDirective,
    MatInputModule,
    MatFormField,
    FormsModule,
    MatSlideToggle,
    MatSelectModule,
    MatButton,
  ],
  templateUrl: './dashboard-page.html',
  styleUrl: './dashboard-page.scss',
})
export class DashboardPage extends BaseComponent implements OnInit, OnDestroy {
  pageTitle = 'Dashboard';

  private telemetry = inject(SignalrTelemetryService);
  private deviceApi = inject(DevicesService);
  private authService = inject(AuthService);
  private simulationService = inject(SimulationService);
  private snackBar = inject(MatSnackBar);

  connectionStatus = this.telemetry.connectionStatus;

  // Adatok
  myDevices = signal<DeviceItem[]>([]);
  liveFeedItems = signal<DashboardLiveFeedItem[]>([]);
  statCards = signal<DashboardStatCard[]>([]);

  // Simulation Controls
  demoMode = signal<boolean>(false);
  selectedSimDeviceId = signal<number | null>(null);

  // Chart logika
  selectedDeviceId = signal<number | null>(null);
  chartOption = signal<EChartsOption | null>(null);

  // Live Dot logika
  private lastSeenMap = signal<Map<number, number>>(new Map());
  private now = signal(Date.now());
  private refreshInterval: any;

  private deviceLookup = computed(() => {
    const map = new Map<number, DeviceItem>();
    this.myDevices().forEach(d => map.set(d.id, d));
    return map;
  });

  constructor() {
    super();

    effect(() => {
      // 1. Figyeljük a Feed változását a Service-ben
      const rawFeed = this.telemetry.telemetryFeed();
      const lookup = this.deviceLookup();
      const mappedFeed: DashboardLiveFeedItem[] = [];

      // 2. Ha jött új adat, frissítjük a Live Dot timestampjét és a Chartot
      if (rawFeed.length > 0) {
        const latest = rawFeed[0];
        const devId = latest.id || 0;

        // Live Dot frissítése
        this.updateLastSeen(devId);

        // Chart frissítése (ha épp ez a tab van nyitva)
        if (this.selectedDeviceId() === devId) {
          this.updateChartForDevice(devId);
        }
      }

      // 3. Feed generálás (jobb oldali sáv)
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

    // Live Dot ticker
    this.refreshInterval = setInterval(() => {
      this.now.set(Date.now());
    }, 1000);
  }

  ngOnDestroy() {
    if (this.refreshInterval) {
      clearInterval(this.refreshInterval);
    }
  }

  toggleDemoMode(isActive: boolean) {
    this.demoMode.set(isActive);
    if (!isActive) {
      this.selectedSimDeviceId.set(null);
    }
  }

  onStartAllSim() {
    if (!this.demoMode()) return;
    this.simulationService.startAllSimulation().subscribe({
      next: () => this.showSnack('Összes szimuláció elindítva'),
      error: () => this.showSnack('Hiba az indításnál', true)
    });
  }

  onStopAllSim() {
    if (!this.demoMode()) return;
    this.simulationService.stopAllSimulation().subscribe({
      next: () => this.showSnack('Összes szimuláció leállítva'),
      error: () => this.showSnack('Hiba a leállításnál', true)
    });
  }

  onStartDeviceSim() {
    const id = this.selectedSimDeviceId();
    if (!this.demoMode() || !id) return;
    this.simulationService.startSimulation(id).subscribe({
      next: () => this.showSnack(`Szimuláció indítva (ID: ${id})`),
      error: () => this.showSnack('Hiba', true)
    });
  }

  onStopDeviceSim() {
    const id = this.selectedSimDeviceId();
    if (!this.demoMode() || !id) return;
    this.simulationService.stopSimulation(id).subscribe({
      next: () => this.showSnack(`Szimuláció leállítva (ID: ${id})`),
      error: () => this.showSnack('Hiba', true)
    });
  }

  private showSnack(msg: string, isError = false) {
    this.snackBar.open(msg, 'OK', { duration: 3000, panelClass: isError ? 'snack-error' : 'snack-success' });
  }

  isDeviceLive(devId: number): boolean {
    const lastSeen = this.lastSeenMap().get(devId);
    if (!lastSeen) return false;

    const device = this.deviceLookup().get(devId);
    let threshold = 10000; // Default 10 sec

    if (device?.timeInterval) {
      threshold = (device.timeInterval * 1000) + 5000; // Interval + 5 sec buffer
    }

    return (this.now() - lastSeen) < threshold;
  }

  private updateLastSeen(devId: number) {
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

  private updateChartForDevice(devId: number) {
    // ITT A VÁLTOZÁS: A Service-ből kérjük el a history-t
    const data = this.telemetry.getDeviceHistory(devId);

    const device = this.deviceLookup().get(devId);
    if (!device) return;

    if (data.length === 0) {
      // Ha még nincs adat, nullázhatjuk, vagy hagyhatjuk a régit (opcionális)
      // Most hagyjuk, hogy üres legyen
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
        data: data // A Service-ből jövő adat
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
    else filtered = devices.filter(d => d.ownerUserName === myUserName ||
        (myCompany && d.company === myCompany));
    this.myDevices.set(filtered);
  }

  private updateStats() {
    this.statCards.set([
      { id: 'devs', title: 'Devices', value: this.myDevices().length.toString(), subtitle: 'Available' },
      { id: 'status', title: 'Status', value: this.connectionStatus(), subtitle: 'SignalR' }
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
