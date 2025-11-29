import {computed, inject, Injectable, signal} from '@angular/core';
import {AuthRestApi} from './auth-rest-api';
import {LoginModel, RegisterModel, TokenModel} from '../auth-models/auth-models';
import { jwtDecode } from "jwt-decode";
import {map} from 'rxjs';
import {ApiClient} from '../../../core/http/api-client';
import {AdminUserItem} from '../../admin/admin-models/admin-models';

export interface JwtPayload {
  sub?: string;
  name?: string;
  role?: string | string[];
  "http://schemas.microsoft.com/ws/2008/06/identity/claims/role"?: string | string[];
  "http://schemas.xmlsoap.org/ws/2005/05/identity/claims/name"?: string;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private authApi = inject(AuthRestApi);
  private apiClient = inject(ApiClient);
  private readonly tokenKey = 'flexibleIotToken';

  private readonly initialToken = localStorage.getItem(this.tokenKey);

  userToken = signal<string | null>(this.initialToken);
  userRoles = signal<string[]>(this.extractRoles(this.initialToken));
  userName = signal<string | null>(this.extractUser(this.initialToken));
  userRoleLabel = computed(() => {
    const roles = this.userRoles;
    return roles && roles().length > 0 ? roles().at(0) : '';
  });

  currentUserId = signal<string | null>(null);
  currentUserCompany = signal<string | null>(null);
  isHydrated = signal<boolean>(false);


  login(model: LoginModel) {
    return this.authApi.login(model).pipe(
      map((tokenModel: TokenModel) => {
        this.saveToken(tokenModel.accessToken);
      })
    );
  }

  register(model: RegisterModel) {
    return this.authApi.register(model);
  }

  logout(): void {
    localStorage.removeItem(this.tokenKey);
    this.userToken.set(null);
    this.userRoles.set([]);
    this.userName.set(null);

    this.currentUserId.set(null);
    this.currentUserCompany.set(null);
    this.isHydrated.set(false);
  }

  getToken(): string | null {
    return this.userToken();
  }

  hydrateUserData() {
    const email = this.userName();
    if (!email) return;

    this.apiClient.get<AdminUserItem[]>('/Users').subscribe({
      next: (users) => {
        const me = users.find(u => u.email === email || u.name === email);
        if (me) {
          console.log('User Hydrated:', me);
          this.currentUserId.set(me.id);
          this.currentUserCompany.set(me.organizationName || null);
          this.isHydrated.set(true);
        } else {
          this.isHydrated.set(true);
        }
      },
      error: (err) => {
        console.error('Hiba a user adatok lekérésekor', err);
        this.isHydrated.set(true);
      }
    });
  }

  hasRole(role: string): boolean {
    return this.userRoles().includes(role);
  }


  private saveToken(token: string): void {
    localStorage.setItem(this.tokenKey, token);
    this.userToken.set(token);
    this.userRoles.set(this.extractRoles(token));
    this.userName.set(this.extractUser(token));
  }

  private extractRoles(token: string | null): string[] {
    if (!token) return [];
    try {
      const decoded = jwtDecode<JwtPayload>(token);
      const roleClaim = decoded.role || decoded['http://schemas.microsoft.com/ws/2008/06/identity/claims/role'];
      if (!roleClaim) return [];
      return Array.isArray(roleClaim) ? roleClaim : [roleClaim];
    } catch {
      return [];
    }
  }

  private extractUser(token: string | null): string | null {
    if (!token) return null;
    try {
      const decoded = jwtDecode<JwtPayload>(token);
      return decoded.name
        || decoded['http://schemas.xmlsoap.org/ws/2005/05/identity/claims/name']
        || decoded.sub
        || null;
    } catch {
      return null;
    }
  }
}
