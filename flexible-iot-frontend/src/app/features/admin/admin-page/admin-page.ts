import {Component, effect, inject, OnInit, signal} from '@angular/core';
import {BaseComponent} from '../../../core/base/base';
import {MatCard, MatCardContent, MatCardTitle} from '@angular/material/card';
import {MatIconModule} from '@angular/material/icon';
import {MatButton, MatIconButton} from '@angular/material/button';
import {AdminOrganizationItem, AdminUserItem, CreateUserRequest} from '../admin-models/admin-models';
import {MatDialog, MatDialogModule} from '@angular/material/dialog';
import {AuthService} from '../../auth/auth-api/auth-service';
import {Router} from '@angular/router';
import AdminService from '../admin-api/admin-service';
import {AdminAddUserDialogComponent} from '../admin-dialogs/admin-add-user-dialog/admin-add-user-dialog';
import {
  AdminAssignCompanyDialogComponent
} from '../admin-dialogs/admin-assign-company-dialog/admin-assign-company-dialog';

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
  private dialog = inject(MatDialog);
  private router = inject(Router);
  protected authService = inject(AuthService); // Protected, hogy a HTML lássa

  pageTitle = 'Administration';

  users = signal<AdminUserItem[]>([]);
  organizations = signal<AdminOrganizationItem[]>([]);

  // Ezzel figyeljük, hogy betöltött-e már a "saját adat"
  constructor() {
    super();

    // Effect: Ha megváltozik a isHydrated signal, lefut ez a logika
    effect(() => {
      if (this.authService.isHydrated()) {
        this.checkAccessAndLoad();
      }
    });
  }

  ngOnInit() {
    // 1. Indítjuk a "felokosítást"
    this.authService.hydrateUserData();
  }

  // Ez a fő beléptető/töltő logika
  private checkAccessAndLoad() {
    const isManager = this.authService.hasRole('Manager');
    const isAdmin = this.authService.hasRole('Admin');
    const isOperator = this.authService.hasRole('Operator');
    const myCompany = this.authService.currentUserCompany();

    // 1. SZŰRŐ: Individual Admin/Operator KIVÁGÁSA
    // Ha nem Manager ÉS nincs cége -> Viszlát (Dashboard)
    if (!isManager && !myCompany) {
      console.warn('Individual Admin/Operator access denied. Redirecting...');
      this.router.navigate(['/dashboard']);
      return;
    }

    // 2. ADATBETÖLTÉS
    // Mindenki betöltheti a usereket (a backend szűr)
    this.loadUsers();

    // Cégeket csak Admin és Manager láthat
    if (isManager || isAdmin) {
      this.loadCompanies();
    }
  }

  loadUsers() {
    this.adminApi.getUsers().subscribe(allUsers => {

      if (this.authService.hasRole('Manager')) {
        this.users.set(allUsers);
        return;
      }

      if (this.authService.hasRole('Admin')) {
        const myCompany = this.authService.currentUserCompany();

        const filtered = allUsers.filter(u =>
          u.organizationName === myCompany || // Saját céges
          !u.organizationName                 // VAGY Individual (nincs cége)
        );

        this.users.set(filtered);
        return;
      }

      if (this.authService.hasRole('Operator')) {
        const myCompany = this.authService.currentUserCompany();

        const filtered = allUsers.filter(u =>
          u.organizationName === myCompany
        );

        this.users.set(filtered);
        return;
      }

      this.users.set([]);
    });
  }

  loadCompanies() {
    this.adminApi.getCompanies().subscribe(res => this.organizations.set(res));
  }

  // --- ACTIONS ---

  openAddUserDialog() {
    // Csak Admin és Manager
    if (!this.authService.hasRole('Manager') && !this.authService.hasRole('Admin')) return;

    const dialogRef = this.dialog.open(AdminAddUserDialogComponent, { width: '400px' });

    dialogRef.afterClosed().subscribe((req: CreateUserRequest) => {
      if (req) {
        this.createUserProcess(req);
      }
    });
  }

  private createUserProcess(req: CreateUserRequest) {
    // 1. Létrehozzuk a usert
    this.adminApi.createUser(req).subscribe({
      next: () => {
        // 2. HA ADMIN VAGYOK: Azonnal hozzá kell rendelni a saját cégemhez!
        // Mert a Register endpoint nem csinálja meg magától.
        if (this.authService.hasRole('Admin') && !this.authService.hasRole('Manager')) {
          this.autoAssignToMyCompany(req.email);
        } else {
          // Manager esetén, vagy ha kész, újratöltünk
          this.loadUsers();
        }
      }
    });
  }

  // Admin trükk: Megkeressük az új usert és rárakjuk a cégünket
  private autoAssignToMyCompany(userEmail: string) {
    const myCompany = this.authService.currentUserCompany();
    if (!myCompany) return; // Nem kéne előfordulnia az effect miatt

    // Frissítjük a listát, hogy megkapjuk az új user ID-ját
    this.adminApi.getUsers().subscribe(users => {
      const newUser = users.find(u => u.email === userEmail);
      if (newUser) {
        this.adminApi.assignCompanyToUser(newUser.id, myCompany).subscribe(() => {
          this.loadUsers(); // Kész, most már céghez kötve jelenik meg
        });
      }
    });
  }

  deleteUser(user: AdminUserItem) {
    // Jogosultság ellenőrzés
    const isManager = this.authService.hasRole('Manager');
    const isAdmin = this.authService.hasRole('Admin');

    if (!isManager && !isAdmin) return;

    if(confirm(`Biztosan törölni szeretnéd: ${user.name}? (Admin esetén csak kikerül a cégből)`)) {
      this.adminApi.deleteUser(user.id).subscribe(() => this.loadUsers());
    }
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
      if (selectedCompanyName !== undefined && selectedCompanyName !== null) {
        this.adminApi.assignCompanyToUser(user.id, selectedCompanyName).subscribe(() => {
          this.loadUsers();
          this.loadCompanies();
        });
      }
    });
  }

  // --- ORG ACTIONS (Csak Manager) ---

  openAddOrgDialog() {
    if (!this.authService.hasRole('Manager')) return;
    const name = prompt("Add meg az új szervezet nevét:");
    if (name) {
      this.adminApi.createCompany(name).subscribe(() => this.loadCompanies());
    }
  }

  deleteOrg(org: AdminOrganizationItem) {
    if (!this.authService.hasRole('Manager')) return;

    if(confirm(`Biztosan törölni szeretnéd a szervezetet: ${org.name}?`)) {
      this.adminApi.deleteCompany(org.id).subscribe(() => {

        this.loadCompanies();
        this.loadUsers();

      });
    }
  }
}
