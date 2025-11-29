import {inject, Injectable} from '@angular/core';
import {ApiClient} from '../../../core/http/api-client';
import {Observable} from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class SimulationService {
  private api = inject(ApiClient);
  private basePath = '/Simulation';

  startAllSimulation(): Observable<any> {
    // A C# kódban ez MapGet volt
    return this.api.get(`${this.basePath}/StartAllSimulation`);
  }

  stopAllSimulation(): Observable<any> {
    return this.api.post(`${this.basePath}/StopAllSimulation`, {});
  }

  startSimulation(deviceId: number): Observable<any> {
    // Query paraméterként küldjük az ID-t
    return this.api.post(`${this.basePath}/StartSimulation?id=${deviceId}`, {});
  }

  stopSimulation(deviceId: number): Observable<any> {
    return this.api.post(`${this.basePath}/StopSimulation?id=${deviceId}`, {});
  }
}
