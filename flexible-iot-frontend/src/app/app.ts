import { Component, signal } from '@angular/core';
import {RouterLink, RouterLinkActive, RouterOutlet} from '@angular/router';
import {MatSidenavModule} from '@angular/material/sidenav';
import {MatToolbarModule} from '@angular/material/toolbar';
import {MatListModule} from '@angular/material/list';
import {MatButtonModule} from '@angular/material/button';
import {MatIconModule} from '@angular/material/icon';


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
  protected readonly title = signal('flexible-iot-frontend');
  readonly navItems = [
    { path: '/dashboard', label: 'Dashboard', icon: 'dashboard' },
    { path: '/devices', label: 'Devices', icon: 'devices' },
    { path: '/telemetry', label: 'Telemetry', icon: 'timeline' },
    { path: '/admin', label: 'Admin', icon: 'admin_panel_settings' },
    { path: '/settings', label: 'Settings', icon: 'settings' }
  ];
}

export default App
