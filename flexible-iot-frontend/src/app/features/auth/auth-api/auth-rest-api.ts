import {inject, Injectable} from '@angular/core';
import {map, Observable} from 'rxjs';
import {ApiClient} from '../../../core/http/api-client';
import {LoginModel, RegisterModel, TokenModel, TokenResponse} from '../auth-models/auth-models';

@Injectable({
  providedIn: 'root'
})
export class AuthRestApi {
  private api = inject(ApiClient);

  login(model: LoginModel): Observable<TokenModel> {
    return this.api.post<TokenResponse>('/Auth/Login', model).pipe(
      map(res => ({
        accessToken: res.token,
        expiration: new Date(res.expiration)
      }))
    );
  }

  register(model: RegisterModel): Observable<void> {
    return this.api.post<any>('/Auth/Register', {
      email: model.email,
      password: model.password,
      role: model.role
    }).pipe(map(() => {}));
  }
}
