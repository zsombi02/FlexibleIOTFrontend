export type AdminUserType = 'company' | 'individual';

// Backend: UserListItemDto
export interface AdminUserItem {
  id: string;
  name: string;
  email: string;
  type: AdminUserType;
  organizationName?: string;
  role: string;
}

// Backend: CompanyDto
export interface AdminOrganizationItem {
  id: number;
  name: string;

}

// Backend: RegisterUserDto (User létrehozáshoz)
export interface CreateUserRequest {
  email: string;
  password: string;
  confirmPassword: string;
  role: string;
}
