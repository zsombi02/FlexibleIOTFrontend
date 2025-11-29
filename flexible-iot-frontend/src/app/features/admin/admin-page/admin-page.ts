import {Component, effect, inject, OnInit, signal} from '@angular/core';
import {BaseComponent} from '../../../core/base/base';
import {MatCard, MatCardContent, MatCardTitle} from '@angular/material/card';
import {MatIconModule} from '@angular/material/icon';
import {MatButton, MatButtonModule, MatIconButton} from '@angular/material/button';
import {AdminOrganizationItem, AdminUserItem, CreateUserRequest} from '../admin-models/admin-models';
import {MAT_DIALOG_DATA, MatDialog, MatDialogModule, MatDialogRef} from '@angular/material/dialog';
import {AuthService} from '../../auth/auth-api/auth-service';
import {Router} from '@angular/router';
import AdminService from '../admin-api/admin-service';
import {AdminAddUserDialogComponent} from '../admin-dialogs/admin-add-user-dialog/admin-add-user-dialog';
import {AdminAssignCompanyDialogComponent} from '../admin-dialogs/admin-assign-company-dialog/admin-assign-company-dialog';
import {CreateDeviceRequest, DeviceItem} from '../../devices/devices-models/devices-models';
import {DevicesService} from '../../devices/devices-api/devices-service';
import {AdminAssignDeviceDialog} from '../admin-dialogs/admin-assign-device-dialog/admin-assign-device-dialog';
import {MatSnackBar} from '@angular/material/snack-bar';
import {MatFormFieldModule} from '@angular/material/form-field';
import {MatInputModule} from '@angular/material/input';
import {FormsModule} from '@angular/forms';
import {DeviceAccessFacade} from '../../../core/base/devices-access-facade';

@Component({
  selector: 'app-admin-page',
  standalone: true,
  imports: [
    MatCardContent,
    MatCardTitle,
    MatCard,
    MatIconModule,
    MatIconButton,
    MatButton,
    MatDialogModule
  ],
  templateUrl: './admin-page.html',
  styleUrl: './admin-page.scss'
})
export class AdminPage extends BaseComponent implements OnInit {
  private adminApi = inject(AdminService);
  private deviceApi = inject(DevicesService);
  private deviceFacade = inject(DeviceAccessFacade); // ÚJ
  private dialog = inject(MatDialog);
  private router = inject(Router);
  protected authService = inject(AuthService);
  private snackBar = inject(MatSnackBar);

  pageTitle = 'Administration';

  users = signal<AdminUserItem[]>([]);
  organizations = signal<AdminOrganizationItem[]>([]);

  // A "assignments" mostantól a facade eszközlistája
  assignments = this.deviceFacade.devices;

  constructor() {
    super();
    effect(() => {
      if (this.authService.isHydrated()) {
        this.checkAccessAndLoad();
      }
    });
  }

  ngOnInit() {
    this.authService.hydrateUserData();
  }

  private checkAccessAndLoad() {
    const isManager = this.authService.hasRole('Manager');
    const myCompany = this.authService.currentUserCompany();

    if (!isManager && !myCompany) {
      this.router.navigate(['/dashboard']);
      return;
    }

    this.loadUsers();

    if (isManager || this.authService.hasRole('Admin')) {
      this.loadCompanies();
      // RÉGI: this.loadAssignments(); --> TÖRÖLVE
      // ÚJ:
      this.deviceFacade.loadDevices();
    }
  }

  // --- ADATBETÖLTÉS ---

  loadUsers() {
    this.adminApi.getUsers().subscribe(allUsers => {
      if (this.authService.hasRole('Manager')) {
        this.users.set(allUsers);
      } else if (this.authService.hasRole('Admin')) {
        const myCompany = this.authService.currentUserCompany();
        this.users.set(allUsers.filter(u => u.organizationName === myCompany || !u.organizationName));
      } else if (this.authService.hasRole('Operator')) {
        const myCompany = this.authService.currentUserCompany();
        this.users.set(allUsers.filter(u => u.organizationName === myCompany));
      } else {
        this.users.set([]);
      }
    });
  }

  loadCompanies() {
    this.adminApi.getCompanies().subscribe(res => this.organizations.set(res));
  }

  // TÖRÖLVE: loadAssignments() metódus (mert a facade végzi)

  // ... (A User Actions és Organization Actions részek változatlanok) ...

  openAddUserDialog() {
    if (!this.authService.hasRole('Manager') && !this.authService.hasRole('Admin')) return;

    const dialogRef = this.dialog.open(AdminAddUserDialogComponent, { width: '400px' });

    dialogRef.afterClosed().subscribe((createdUserRequest: CreateUserRequest | undefined) => {
      if (createdUserRequest) {

        this.snackBar.open(`User ${createdUserRequest.email} created!`, 'OK', {
          duration: 3000,
          panelClass: 'snack-success'
        });

        if (this.authService.hasRole('Admin') && !this.authService.hasRole('Manager')) {
          this.autoAssignToMyCompany(createdUserRequest.email);
        } else {
          this.loadUsers();
        }
      }
    });
  }

  private autoAssignToMyCompany(userEmail: string) {
    const myCompany = this.authService.currentUserCompany();
    if (!myCompany) return;

    this.adminApi.getUsers().subscribe(users => {
      const newUser = users.find(u => u.email === userEmail);
      if (newUser) {
        this.adminApi.assignCompanyToUser(newUser.id, myCompany).subscribe(() => {
          this.loadUsers();
        });
      }
    });
  }

  deleteUser(user: AdminUserItem) {
    const isManager = this.authService.hasRole('Manager');
    const isAdmin = this.authService.hasRole('Admin');

    if (!isManager && !isAdmin) return;

    const dialogRef = this.dialog.open(AdminConfirmDialog, {
      width: '400px',
      data: {
        title: 'Delete User',
        message: `Are you sure you want to delete user: ${user.name}?`,
        confirmText: 'Delete',
        confirmColor: 'warn'
      }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.adminApi.deleteUser(user.id).subscribe(() => this.loadUsers());
      }
    });
  }

  openAssignCompanyDialog(user: AdminUserItem) {
    const isManager = this.authService.hasRole('Manager');
    const isAdmin = this.authService.hasRole('Admin');

    if (!isManager && !isAdmin) return;

    let companiesToShow: AdminOrganizationItem[] = [];

    if (isManager) {
      companiesToShow = this.organizations();
    } else if (isAdmin) {
      const myCompanyName = this.authService.currentUserCompany();
      const myCompanyObj = this.organizations().find(c => c.name === myCompanyName);
      if (myCompanyObj) {
        companiesToShow = [myCompanyObj];
      }
    }

    const dialogRef = this.dialog.open(AdminAssignCompanyDialogComponent, {
      width: '400px',
      data: {
        user: user,
        companies: companiesToShow
      }
    });

    dialogRef.afterClosed().subscribe((selectedCompanyName: string | null) => {
      if (selectedCompanyName !== undefined && selectedCompanyName !== '') {
        if(selectedCompanyName == null) selectedCompanyName = '';
        this.adminApi.assignCompanyToUser(user.id, selectedCompanyName).subscribe(() => {
          this.loadUsers();
          this.loadCompanies();
        });
      }
    });
  }

  openAddOrgDialog() {
    if (!this.authService.hasRole('Manager')) return;

    const dialogRef = this.dialog.open(AdminPromptDialog, {
      width: '400px',
      data: {
        title: 'Create Company',
        label: 'Company Name',
        confirmText: 'Create'
      }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.adminApi.createCompany(result).subscribe(() => this.loadCompanies());
      }
    });
  }

  deleteOrg(org: AdminOrganizationItem) {
    if (!this.authService.hasRole('Manager')) return;

    const dialogRef = this.dialog.open(AdminConfirmDialog, {
      width: '400px',
      data: {
        title: 'Delete Company',
        message: `Are you sure you want to delete company: ${org.name}? \nThis might affect users assigned to it.`,
        confirmText: 'Delete',
        confirmColor: 'warn'
      }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.adminApi.deleteCompany(org.id).subscribe(() => {
          this.loadCompanies();
          this.loadUsers();
        });
      }
    });
  }

  // --- DEVICE ASSIGNMENT ACTIONS ---

  openAssignDeviceDialog(device: DeviceItem) {
    const isManager = this.authService.hasRole('Manager');
    const isAdmin = this.authService.hasRole('Admin');
    if (!isManager && !isAdmin) return;

    let companiesToShow: AdminOrganizationItem[] = [];
    if (isManager) {
      companiesToShow = this.organizations();
    } else if (isAdmin) {
      const myCompanyName = this.authService.currentUserCompany();
      const myCompanyObj = this.organizations().find(c => c.name === myCompanyName);
      if (myCompanyObj) companiesToShow = [myCompanyObj];
    }

    const dialogRef = this.dialog.open(AdminAssignDeviceDialog, {
      width: '400px',
      data: {
        device: device,
        companies: companiesToShow
      }
    });

    dialogRef.afterClosed().subscribe((selectedCompany: string | null | undefined) => {
      if (selectedCompany !== undefined && selectedCompany !== '') {
        this.saveDeviceAssignment(device, selectedCompany);
      }
    });
  }

  private saveDeviceAssignment(device: DeviceItem, newCompany: string | null) {
    const updateDto: CreateDeviceRequest = {
      name: device.name,
      topic: device.topic,
      type: device.type,
      timeInterval: device.timeInterval,
      ownerUserName: device.ownerUserName,
      companyName: newCompany || undefined,
      description: ''
    };
    this.deviceApi.updateDevice(device.id, updateDto).subscribe(() => {
      // ÚJ: Itt is a facade-ot frissítjük az Assignment lista helyett
      this.deviceFacade.loadDevices();
    });
  }
}

// ... Helper Dialogs (Maradnak a fájl végén, változatlanul) ...
@Component({
  selector: 'app-admin-confirm-dialog',
  standalone: true,
  imports: [MatDialogModule, MatButtonModule],
  template: `
    <h2 mat-dialog-title>{{ data.title }}</h2>
    <mat-dialog-content>
      <p style="white-space: pre-line;">{{ data.message }}</p>
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button mat-dialog-close>Cancel</button>
      <button mat-raised-button [color]="data.confirmColor || 'primary'" [mat-dialog-close]="true">
        {{ data.confirmText || 'Confirm' }}
      </button>
    </mat-dialog-actions>
  `
})
export class AdminConfirmDialog {
  data = inject(MAT_DIALOG_DATA);
}

@Component({
  selector: 'app-admin-prompt-dialog',
  standalone: true,
  imports: [MatDialogModule, MatButtonModule, MatFormFieldModule, MatInputModule, FormsModule],
  template: `
    <h2 mat-dialog-title>{{ data.title }}</h2>
    <mat-dialog-content>
      <mat-form-field appearance="outline" style="width: 100%; margin-top: 10px;">
        <mat-label>{{ data.label }}</mat-label>
        <input matInput [(ngModel)]="value" (keyup.enter)="onSave()" cdkFocusInitial>
      </mat-form-field>
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button (click)="onCancel()">Cancel</button>
      <button mat-raised-button color="primary" (click)="onSave()" [disabled]="!value">
        {{ data.confirmText || 'OK' }}
      </button>
    </mat-dialog-actions>
  `
})
export class AdminPromptDialog {
  data = inject(MAT_DIALOG_DATA);
  dialogRef = inject(MatDialogRef<AdminPromptDialog>);
  value = '';

  onSave() {
    this.dialogRef.close(this.value);
  }
  onCancel() {
    this.dialogRef.close();
  }
}
