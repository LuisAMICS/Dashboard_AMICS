import { ChangeDetectionStrategy, ChangeDetectorRef, Component, inject, OnInit } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet, Router } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { CommonModule } from '@angular/common';
import { SupabaseService } from '../core/services/supabase.service';
import { AuthService } from '../core/services/auth.service';

@Component({
  selector: 'app-layout',
  standalone: true,
  imports: [RouterOutlet, RouterLink, RouterLinkActive, MatIconModule, CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="flex h-screen w-full bg-gray-50/50 overflow-hidden">
      <!-- Sidebar -->
      <aside class="w-64 bg-white border-r border-gray-200 flex flex-col flex-shrink-0 z-20">
        <!-- Logo -->
        <div class="h-20 flex items-center border-b border-gray-100">
          <div class="flex items-center justify-center w-full px-4">
            <img src="amics-logo.png" alt="AMICS" class="w-32 h-14 object-contain" />
          </div>
        </div>

        <!-- Navigation -->
        <nav class="flex-1 overflow-y-auto py-4 px-3 space-y-1">
          @for (item of navItems; track item.path) {
            <a
              [routerLink]="item.path"
              routerLinkActive="bg-brand-50 text-brand-600 font-medium"
              [routerLinkActiveOptions]="{exact: item.exact}"
              #rla="routerLinkActive"
              class="flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-gray-600 hover:bg-gray-50 hover:text-gray-900 transition-colors group"
            >
              <mat-icon class="!w-5 !h-5 !text-[20px] text-gray-400 group-hover:text-gray-600" [class.!text-brand-600]="rla.isActive">{{ item.icon }}</mat-icon>
              {{ item.label }}
            </a>
          }
        </nav>

        <!-- User Profile -->
        <div class="p-4 border-t border-gray-100">
          <div [routerLink]="['/settings']" class="flex items-center gap-3 px-2 py-2 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors group">
            <img [src]="profile?.avatar_url || 'https://i.pravatar.cc/150?u=admin'" alt="User" class="w-8 h-8 rounded-full border border-gray-200 object-cover" referrerpolicy="no-referrer" />
            <div class="flex-1 min-w-0">
              <p class="text-sm font-bold text-gray-900 truncate">{{ profile?.full_name || 'Cargando...' }}</p>
              <p class="text-[10px] font-bold text-gray-400 uppercase tracking-widest truncate">{{ profile?.role || 'User' }}</p>
            </div>
            <button (click)="logout($event)" class="p-1 text-gray-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all">
                <mat-icon class="!w-4 !h-4 !text-[16px]">logout</mat-icon>
            </button>
          </div>
        </div>
      </aside>

      <!-- Main Content -->
      <div class="flex-1 flex flex-col min-w-0 overflow-hidden">
        <!-- Topbar -->
        <header class="h-16 bg-white/80 backdrop-blur-md border-b border-gray-200 flex items-center justify-between px-8 flex-shrink-0 z-10">
          <!-- Search -->
          <div class="flex-1 max-w-md">
            <div class="relative group">
              <mat-icon class="absolute left-3 top-1/2 -translate-y-1/2 !w-5 !h-5 !text-[20px] text-gray-400 group-focus-within:text-brand-500 transition-colors">search</mat-icon>
              <input 
                type="text" 
                placeholder="Buscar en todo el workspace... (Cmd+K)" 
                class="w-full pl-10 pr-4 py-2 bg-gray-100/50 border-transparent focus:bg-white focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 rounded-lg text-sm transition-all outline-none"
              />
            </div>
          </div>

          <!-- Actions -->
          <div class="flex items-center gap-4 ml-4">
            <button class="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors relative">
              <mat-icon class="!w-5 !h-5 !text-[20px]">notifications_none</mat-icon>
              <span class="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full border-2 border-white"></span>
            </button>
            <div class="w-px h-6 bg-gray-200"></div>
            <button class="flex items-center gap-2 bg-gray-900 hover:bg-gray-800 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors shadow-sm">
              <mat-icon class="!w-4 !h-4 !text-[16px]">add</mat-icon>
              Nuevo
            </button>
          </div>
        </header>

        <!-- Page Content -->
        <main class="flex-1 overflow-y-auto p-8">
          <div class="max-w-[1600px] mx-auto">
            <router-outlet></router-outlet>
          </div>
        </main>
      </div>
    </div>
  `
})
export class LayoutComponent implements OnInit {
  private supabase = inject(SupabaseService);
  private auth = inject(AuthService);
  private router = inject(Router);
  private cdr = inject(ChangeDetectorRef);

  profile: any = null;

  navItems = [
    { path: '/', label: 'Home', icon: 'home', exact: true },
    { path: '/crm', label: 'CRM', icon: 'view_kanban', exact: false },
    { path: '/clients', label: 'Clientes', icon: 'business', exact: false },
    { path: '/projects', label: 'Proyectos', icon: 'folder_open', exact: false },
    { path: '/tasks', label: 'Tareas', icon: 'check_circle_outline', exact: false },
    { path: '/documents', label: 'Documentos', icon: 'description', exact: false },
    { path: '/calendar', label: 'Calendario', icon: 'calendar_today', exact: false },
    { path: '/activity', label: 'Actividad', icon: 'timeline', exact: false },
    { path: '/reports', label: 'Reportes', icon: 'bar_chart', exact: false },
    { path: '/settings', label: 'Ajustes', icon: 'settings', exact: false },
  ];

  ngOnInit() {
    this.loadProfile();
  }

  async loadProfile() {
    try {
      this.profile = await this.supabase.getMyProfile();
      this.cdr.markForCheck();
    } catch (error) {
      console.error('Error loading layout profile:', error);
    }
  }

  async logout(event: Event) {
    event.stopPropagation();
    await this.auth.signOut().toPromise();
    this.router.navigate(['/login']);
  }
}
