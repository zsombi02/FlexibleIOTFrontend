export type AdminUserType = 'company' | 'individual';

export interface AdminUserItem {
  id: string;
  name: string;
  email: string;
  type: AdminUserType;
  organizationName?: string;
  role: string;
}

export interface AdminOrganizationItem {
  id: number;
  name: string;

}

export interface CreateUserRequest {
  email: string;
  password: string;
  confirmPassword: string;
  role: string;
}
