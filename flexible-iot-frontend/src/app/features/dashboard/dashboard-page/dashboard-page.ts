import {Component, computed, effect, inject, OnInit, signal} from '@angular/core';
import {BaseComponent} from '../../../core/base/base';
import {
  DashboardLiveFeedItem,
  DashboardStatCard,
  DashboardTelemetryCard,
  DashboardTopDevice
} from '../dashboard-models/dashboard-models';
import {MatCardModule} from '@angular/material/card';
import {SignalrTelemetryService} from '../../../core/realtime/signalr-telemetry-service';
import {DevicesService} from '../../devices/devices-api/devices-service';
import {AuthService} from '../../auth/auth-api/auth-service';
import {DeviceItem} from '../../devices/devices-models/devices-models';


@Component({
  selector: 'app-dashboard-page',
  imports: [MatCardModule],
  templateUrl: './dashboard-page.html',
  styleUrl: './dashboard-page.scss',
})
export class DashboardPage extends BaseComponent implements OnInit {
  pageTitle = 'Dashboard';

  // Services
  private telemetry = inject(SignalrTelemetryService);
  private deviceApi = inject(DevicesService);
  private authService = inject(AuthService);

  // Status Signals
  connectionStatus = this.telemetry.connectionStatus;
  timeWindowLabel = signal('Valós idejű');

  // Data Signals
  allDevices = signal<DeviceItem[]>([]);      // Nyers lista a backendről
  myDevices = signal<DeviceItem[]>([]);       // Jogosultság szerint szűrt lista

  // UI Signals
  statCards = signal<DashboardStatCard[]>([]);
  telemetryCard = signal<DashboardTelemetryCard | null>(null);
  liveFeedItems = signal<DashboardLiveFeedItem[]>([]);
  topDevices = signal<DashboardTopDevice[]>([]); // Ezt egyelőre hagyjuk placeholderen

  // Lookup Map: ID -> Device (hogy a SignalR ID-ból nevet tudjunk varázsolni)
  private deviceMap = computed(() => {
    const map = new Map<number, DeviceItem>();
    this.myDevices().forEach(d => map.set(d.id, d));
    return map;
  });

  constructor() {
    super();

    // 1. Live Feed Effect
    effect(() => {
      const rawFeed = this.telemetry.telemetryFeed();
      const lookup = this.deviceMap();

      const mappedFeed: DashboardLiveFeedItem[] = [];
      let lastTelemetryTime = 'N/A';

      // Végigmegyünk a bejövő adatokon
      for (const t of rawFeed) {
        const devId = t.id || 0;

        const device = lookup.get(devId);

        if (device) {
          mappedFeed.push({
            id: `feed-${t.timeStamp}-${devId}`,
            deviceName: device.name,  // Kicseréljük az ID-t a névre!
            metricName: device.type,  // Pl. "pm25"
            value: t.value?.toString() ?? '0',
            unit: this.getUnitByType(device.type), // Helper fv.
            time: new Date(t.timeStamp).toLocaleTimeString()
          });

          // Az első elem a legfrissebb
          if (lastTelemetryTime === 'N/A') {
            lastTelemetryTime = new Date(t.timeStamp).toLocaleTimeString();
          }
        }
      }

      this.liveFeedItems.set(mappedFeed);

      // Frissítjük a stat kártyát is (Utolsó telemetria)
      this.updateLastTelemetryStat(lastTelemetryTime);

      // Frissítjük a grafikont is az új adatokkal
      this.updateChart(mappedFeed);
    });
  }

  ngOnInit() {
    this.initData();
    this.initSignalR();
  }

  private async initSignalR(): Promise<void> {
    try {
      await this.telemetry.start();
    } catch (e) {
      console.error(e);
    }
  }

  private initData() {
    // 1. Lekérjük az összes eszközt
    this.deviceApi.getAllDevices().subscribe({
      next: (devices) => {
        this.allDevices.set(devices);
        this.filterDevicesByRole(devices);
        this.updateStats(); // Statisztikák frissítése a lista alapján
      }
    });
  }

  // --- SZŰRÉSI LOGIKA ---
  private filterDevicesByRole(devices: DeviceItem[]) {
    const isManager = this.authService.hasRole('Manager');
    const isAdmin = this.authService.hasRole('Admin');
    // const isOperator = this.authService.hasRole('Operator'); // Nem kell külön, az az 'else' ág

    const myCompany = this.authService.currentUserCompany();
    const myUserName = this.authService.userName(); // Az email cím a username nálad

    let filtered: DeviceItem[] = [];

    if (isManager) {
      // Manager: MINDENT lát
      filtered = devices;
    }
    else if (isAdmin) {
      // Admin: Saját cég VAGY ahol ő az owner
      filtered = devices.filter(d =>
        (myCompany && d.company === myCompany) ||
        d.ownerUserName === myUserName
      );
    }
    else {
      // Operator (Individual): Csak ahol ő az owner
      filtered = devices.filter(d => d.ownerUserName === myUserName);
    }

    this.myDevices.set(filtered);
    console.log('Filtered Devices for Dashboard:', filtered.length);
  }

  // --- STATISZTIKÁK ---
  private updateStats() {
    const count = this.myDevices().length;

    // Egyszerű statisztika
    this.statCards.set([
      {
        id: 'total-devices',
        title: 'Látható eszközök',
        value: count.toString(),
        subtitle: 'Jogosultság szerint'
      },
      {
        id: 'active-devices',
        title: 'Adatot küldött',
        value: '---',
        subtitle: 'Mióta beléptél'
      },
      {
        id: 'last-telemetry',
        title: 'Utolsó adat',
        value: '---',
        subtitle: 'Várakozás...'
      }
    ]);
  }

  private updateLastTelemetryStat(time: string) {
    this.statCards.update(cards => {
      const newCards = [...cards];
      const lastTelCard = newCards.find(c => c.id === 'last-telemetry');
      if (lastTelCard) {
        lastTelCard.value = time;
        lastTelCard.subtitle = time === 'N/A' ? 'Nincs adat' : 'Frissítve';
      }
      return newCards;
    });
  }

  // --- GRAFIKON LOGIKA (Egyszerűsített) ---
  // Összegyűjti az összes bejövő adatot egy "idősorba"
  private updateChart(feed: DashboardLiveFeedItem[]) {
    // Ha nincs adat, ne csináljunk semmit
    if (feed.length === 0) return;

    // Veszünk egy eszközt a feedből (pl. az elsőt), és annak az adatait rajzoljuk ki
    // Ez egy egyszerűsítés, de látványos.
    const latestItem = feed[0];

    this.telemetryCard.set({
      title: 'Élő Adatfolyam',
      selectedMetricLabel: 'Eszköz:',
      selectedMetricKey: latestItem.deviceName, // Kiírjuk, melyik eszköz adata ez
      metricOptions: [],
      modeLabel: 'Valós idő',
      placeholderText: `${latestItem.value} ${latestItem.unit}`, // Nagy számmal kiírjuk az értéket
      // Itt később átadhatunk egy tömböt a Chart komponensnek
    });
  }

  // Helper unitokhoz
  private getUnitByType(type: string): string {
    const t = type.toLowerCase();
    if (t.includes('temp')) return '°C';
    if (t.includes('hum')) return '%';
    if (t.includes('volt')) return 'V';
    if (t.includes('press')) return 'bar';
    return '';
  }
}
