import {inject, Injectable} from '@angular/core';
import {ApiClient} from '../../../core/http/api-client';

@Injectable({
  providedIn: 'root',
})
export class DashboardOverviewRestApi {
  private apiClient = inject(ApiClient);


}
