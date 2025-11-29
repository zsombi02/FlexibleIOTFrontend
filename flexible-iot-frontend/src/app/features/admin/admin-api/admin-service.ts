import {inject, Injectable} from '@angular/core';
import {ApiClient} from '../../../core/http/api-client';
import {Observable} from 'rxjs';
import {AdminOrganizationItem, AdminUserItem, CreateUserRequest} from '../admin-models/admin-models';

@Injectable({
  providedIn: 'root'
})
class AdminService {
  private api = inject(ApiClient);

  // --- USERS ---

  getUsers(): Observable<AdminUserItem[]> {
    // Üres companyName = mindenki listázása
    return this.api.get<AdminUserItem[]>('/Users');
  }

  createUser(data: CreateUserRequest): Observable<any> {
    return this.api.post('/Auth/Register', data);
  }

  deleteUser(id: string): Observable<void> {
    return this.api.delete(`/Users/${id}`);
  }

  assignCompanyToUser(userId: string, companyName: string): Observable<void> {
    return this.api.put(`/Users/${userId}/company`, { companyName });
  }

  // --- COMPANIES ---

  getCompanies(): Observable<AdminOrganizationItem[]> {
    return this.api.get<AdminOrganizationItem[]>('/Companies');
  }

  createCompany(name: string): Observable<AdminOrganizationItem> {
    return this.api.post<AdminOrganizationItem>('/Companies', { name });
  }

  deleteCompany(id: number): Observable<void> {
    return this.api.delete(`/Companies/${id}`);
  }
}

export default AdminService
