import {inject, Injectable} from '@angular/core';
import {ApiClient} from '../../../core/http/api-client';
import {HttpParams} from '@angular/common/http';
import {TelemetryPointDto} from '../telemetry-models/telemetry-models';
import {Observable} from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class TelemetryService {
  private api = inject(ApiClient);

  getTelemetryHistory(deviceId: number, from?: Date | null, to?: Date | null): Observable<TelemetryPointDto[]> {
    let params = new HttpParams();

    // Csak akkor adjuk hozzá, ha nem null
    if (from) {
      params = params.set('from', from.toISOString());
    }
    if (to) {
      params = params.set('to', to.toISOString());
    }

    // Most már átmegy a params is!
    return this.api.get<TelemetryPointDto[]>(`/Telemetry/${deviceId}`, { params });
  }
}
