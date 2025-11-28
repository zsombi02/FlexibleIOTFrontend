import { Routes } from '@angular/router';
import {DashboardPage} from './features/dashboard/dashboard-page/dashboard-page';
import {DevicesPage} from './features/devices/devices-page/devices-page';
import {TelemetryPage} from './features/telemetry/telemetry-page/telemetry-page';
import {AdminPage} from './features/admin/admin-page/admin-page';
import {SettingsPage} from './features/settings/settings-page/settings-page';
import {DevicesDetailsPage} from './features/devices/devices-details-page/devices-details-page';
import {LoginPage} from './features/auth/login-page/login-page';

export const routes: Routes = [
  { path: '', pathMatch: 'full', redirectTo: 'dashboard' },

  { path: 'dashboard', component: DashboardPage, title: 'Dashboard' },
  { path: 'devices', component: DevicesPage, title: 'Devices' },
  { path: 'devices/:id', component: DevicesDetailsPage, title: 'DevicesDetails' },
  { path: 'telemetry', component: TelemetryPage, title: 'Telemetry' },
  { path: 'admin', component: AdminPage, title: 'Administration' },
  { path: 'settings', component: SettingsPage, title: 'Settings' },
  { path: 'login', component: LoginPage, title: 'Login' },

  // auth később:
  // { path: 'auth', component: AuthPageComponent, title: 'Sign in' },

  { path: '**', redirectTo: 'dashboard' }
];
