import {inject, Injectable} from '@angular/core';
import {HttpClient} from '@angular/common/http';
import {environment} from '../../../environments/environment';
import {Observable} from 'rxjs';
import {HttpParams} from '@angular/common/http';

@Injectable({
  providedIn: 'root',
})
export class ApiClient {
  private http = inject(HttpClient);
  private baseUrl = environment.apiBaseUrl;

  get<T>(path: string, options?: { params?: HttpParams }): Observable<T> {
    return this.http.get<T>(`${this.baseUrl}${path}`, options);
  }

  post<T>(path: string, body: unknown): Observable<T> {
    return this.http.post<T>(`${this.baseUrl}${path}`, body);
  }

  put<T>(path: string, body: unknown): Observable<T> {
    return this.http.put<T>(`${this.baseUrl}${path}`, body);
  }

  delete<T>(path: string): Observable<T> {
    return this.http.delete<T>(`${this.baseUrl}${path}`);
  }
}
