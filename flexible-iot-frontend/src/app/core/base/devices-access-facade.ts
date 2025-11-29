import {computed, inject, Injectable, signal} from '@angular/core';
import {DevicesService} from '../../features/devices/devices-api/devices-service';
import {AuthService} from '../../features/auth/auth-api/auth-service';
import {DeviceItem} from '../../features/devices/devices-models/devices-models';

@Injectable({
  providedIn: 'root'
})
export class DeviceAccessFacade {
  private devicesApi = inject(DevicesService);
  private auth = inject(AuthService);

  // Ez a signal tárolja a már megszűrt, felhasználónak releváns eszközöket
  private _devices = signal<DeviceItem[]>([]);

  // Publikus csak olvasható signal a komponenseknek
  readonly devices = this._devices.asReadonly();

  // Opcionális: Számított értékek (pl. Dashboard statisztikához)
  readonly deviceCount = computed(() => this._devices().length);


  loadDevices() {
    this.devicesApi.getAllDevices().subscribe(allDevices => {
      const filtered = this.applyRoleFiltering(allDevices);
      this._devices.set(filtered);
    });
  }


  private applyRoleFiltering(allDevices: DeviceItem[]): DeviceItem[] {
    const isManager = this.auth.hasRole('Manager');
    const isAdmin = this.auth.hasRole('Admin');
    const myCompany = this.auth.currentUserCompany();
    const myName = this.auth.userName();

    if (isManager) {
      // A Manager mindent lát
      return allDevices;
    }

    if (isAdmin) {
      // Az Admin látja a saját cégét ÉS a saját nevén lévőket
      return allDevices.filter(d =>
        (myCompany && d.company === myCompany) || d.company === '' ||
        d.ownerUserName === myName
      );
    }

    return allDevices.filter(d =>
      d.ownerUserName === myName ||
      (myCompany && d.company === myCompany)
    );
  }
}
