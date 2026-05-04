import { Routes } from '@angular/router';
import { CompareComponent } from './pages/compare/compare';

export const routes: Routes = [
  { path: '', component: CompareComponent },
  { path: 'history', loadComponent: () => import('./pages/history/history').then(m => m.HistoryComponent) },
  { path: '**', redirectTo: '' }
];