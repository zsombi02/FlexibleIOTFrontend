export class LoginModel {
  email: string = '';
  password: string = '';
}

export class RegisterModel {
  email: string = '';
  password: string = '';
  confirmPassword: string = '';
  role: string = 'Operator';
  organizationName?: string;
}

export interface TokenResponse {
  token: string;
  expiration: string;
}

export class TokenModel {
  accessToken: string = '';
  expiration: Date = new Date();
}
