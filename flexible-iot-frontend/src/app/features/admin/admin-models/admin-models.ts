export type AdminUserType = 'company' | 'individual';

export interface AdminUserItem {
  id: string;
  name: string;
  email: string;
  type: AdminUserType;      // 'company' = céges user, 'individual' = egyéni
  organizationName?: string;
  role: string;             // pl. 'Admin', 'Viewer'
}

export interface AdminOrganizationItem {
  id: string;
  name: string;
  contactPerson: string;
  userCount: number;
  deviceCount: number;
}

export interface AdminAssignmentItem {
  id: string;
  userName: string;
  organizationName: string;
  deviceName: string;
  role: string;             // pl. 'Owner', 'Viewer'
}
