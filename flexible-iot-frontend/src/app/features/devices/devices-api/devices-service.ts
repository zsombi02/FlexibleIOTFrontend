import {inject, Injectable} from '@angular/core';
import {ApiClient} from '../../../core/http/api-client';
import {Observable} from 'rxjs';
import {DeviceDetails, DeviceItem} from '../devices-models/devices-models';

class CreateDeviceRequest {
}

@Injectable({
  providedIn: 'root'
})
export class DevicesService {
  private api = inject(ApiClient);

  getAllDevices(): Observable<DeviceItem[]> {
    return this.api.get<DeviceItem[]>('/Devices');
  }

  getDeviceById(id: number): Observable<DeviceDetails> {
    return this.api.get<DeviceDetails>(`/Devices/${id}`);
  }

  createDevice(data: CreateDeviceRequest): Observable<any> {
    return this.api.post('/Devices', data);
  }

  updateDevice(id: number, data: CreateDeviceRequest): Observable<any> {
    return this.api.put(`/Devices/${id}`, data);
  }

  deleteDevice(id: number): Observable<void> {
    return this.api.delete(`/Devices/${id}`);
  }
}
