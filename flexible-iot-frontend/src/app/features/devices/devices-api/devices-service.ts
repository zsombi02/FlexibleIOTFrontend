import {inject, Injectable} from '@angular/core';
import {ApiClient} from '../../../core/http/api-client';
import {Observable} from 'rxjs';
import {DeviceItem} from '../devices-models/devices-models';

@Injectable({
  providedIn: 'root'
})
export class DevicesService {
  private api = inject(ApiClient);

  getAllDevices(): Observable<DeviceItem[]> {
    return this.api.get<DeviceItem[]>('/Devices');
  }
}
