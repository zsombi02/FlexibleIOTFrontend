import {Component, computed, inject, signal} from '@angular/core';
import {Router, RouterLink, RouterLinkActive, RouterOutlet} from '@angular/router';
import {MatSidenavModule} from '@angular/material/sidenav';
import {MatToolbarModule} from '@angular/material/toolbar';
import {MatListModule} from '@angular/material/list';
import {MatButtonModule} from '@angular/material/button';
import {MatIconModule} from '@angular/material/icon';
import {AuthService} from './features/auth/auth-api/auth-service';


@Component({
  selector: 'app-root',
  imports: [
    RouterOutlet,
    MatToolbarModule,
    MatSidenavModule,
    MatListModule,
    MatButtonModule,
    RouterLink,
    MatIconModule,
    RouterLinkActive,
  ],
  templateUrl: './app.html',
  styleUrl: './app.scss'
})
class App {
  protected authService = inject(AuthService);
  private router = inject(Router);

  protected readonly title = signal('flexible-iot-frontend');

  protected isLoggedIn = computed(() => !!this.authService.userToken());

  readonly navItems = [
    { path: '/dashboard', label: 'Dashboard', icon: 'dashboard' },
    { path: '/devices', label: 'Devices', icon: 'devices' },
    { path: '/telemetry', label: 'Telemetry', icon: 'timeline' },
    { path: '/admin', label: 'Admin', icon: 'admin_panel_settings' },
  ];

  logout() {
    this.authService.logout();
    this.router.navigate(['/login']);
  }
}

export default App;
