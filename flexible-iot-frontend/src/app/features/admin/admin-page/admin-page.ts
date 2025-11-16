import {Component, signal} from '@angular/core';
import {AdminAssignmentItem, AdminOrganizationItem, AdminUserItem} from '../admin-models/admin-models';
import {BaseComponent} from '../../../core/base/base';
import {MatCard, MatCardContent, MatCardTitle} from '@angular/material/card';
import {MatIconModule} from '@angular/material/icon';
import {MatButton, MatIconButton} from '@angular/material/button';


@Component({
  selector: 'app-admin-page',
  imports: [
    MatCardContent,
    MatCardTitle,
    MatCard,
    MatIconModule,
    MatIconButton,
    MatButton
  ],
  templateUrl: './admin-page.html',
  styleUrl: './admin-page.scss',
})
export class AdminPage extends BaseComponent {
  pageTitle = 'Administration';

  users = signal<AdminUserItem[]>([]);
  organizations = signal<AdminOrganizationItem[]>([]);
  assignments = signal<AdminAssignmentItem[]>([]);

  constructor() {
    super();
    this.initPlaceholderData();
  }

  private initPlaceholderData(): void {
    this.users.set([
      {
        id: 'user-001',
        name: 'System Admin',
        email: 'admin@platform.local',
        type: 'company',
        organizationName: 'Platform Root',
        role: 'Super Admin'
      },
      {
        id: 'user-002',
        name: 'Acme Admin',
        email: 'admin@acme.com',
        type: 'company',
        organizationName: 'Acme Ltd.',
        role: 'Org Admin'
      },
      {
        id: 'user-003',
        name: 'John Doe',
        email: 'john.doe@example.com',
        type: 'individual',
        role: 'Owner'
      }
    ]);

    this.organizations.set([
      {
        id: 'org-001',
        name: 'Acme Ltd.',
        contactPerson: 'Acme Admin',
        userCount: 5,
        deviceCount: 32
      },
      {
        id: 'org-002',
        name: 'Ware Inc.',
        contactPerson: 'Warehouse Manager',
        userCount: 3,
        deviceCount: 18
      }
    ]);

    this.assignments.set([
      {
        id: 'ass-001',
        userName: 'Acme Admin',
        organizationName: 'Acme Ltd.',
        deviceName: 'ESP-Room-201',
        role: 'Owner'
      },
      {
        id: 'ass-002',
        userName: 'John Doe',
        organizationName: '—',
        deviceName: 'ESP-Home-01',
        role: 'Owner'
      }
    ]);
  }
}
