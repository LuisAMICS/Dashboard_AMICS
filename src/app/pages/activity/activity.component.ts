import { ChangeDetectionStrategy, ChangeDetectorRef, Component, inject, OnInit } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { CommonModule, DatePipe } from '@angular/common';
import { SupabaseService } from '../../core/services/supabase.service';

@Component({
  selector: 'app-activity',
  standalone: true,
  imports: [MatIconModule, CommonModule, DatePipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="max-w-4xl mx-auto space-y-6 relative h-full flex flex-col overflow-hidden">
      <!-- Loader Overlay -->
      @if (isLoading) {
        <div class="absolute inset-0 bg-white/60 backdrop-blur-[2px] z-50 flex items-center justify-center">
            <div class="flex flex-col items-center">
                <div class="w-12 h-12 border-4 border-brand-200 border-t-brand-600 rounded-full animate-spin"></div>
                <p class="mt-4 text-sm font-medium text-gray-600">Cargando historial...</p>
            </div>
        </div>
      }

      <!-- Header -->
      <div class="flex items-center justify-between flex-shrink-0 px-1">
        <div>
          <h1 class="text-2xl font-display font-bold text-gray-900 tracking-tight">Registro de Actividad</h1>
          <p class="text-sm text-gray-500 mt-1">Historial completo de acciones en el workspace.</p>
        </div>
        <div class="flex items-center gap-3">
          <button (click)="loadActivity()" class="px-4 py-2 bg-white border border-gray-200 text-gray-700 rounded-lg text-sm font-bold hover:bg-gray-50 flex items-center gap-2 transition-all shadow-sm active:scale-95">
            <mat-icon class="!w-4 !h-4 !text-[16px]">refresh</mat-icon> Actualizar
          </button>
          <button class="px-4 py-2 bg-gray-900 text-white border border-transparent rounded-lg text-sm font-bold hover:bg-gray-800 flex items-center gap-2 transition-all shadow-sm active:scale-95">
            <mat-icon class="!w-4 !h-4 !text-[16px]">download</mat-icon> Exportar
          </button>
        </div>
      </div>

      <!-- Timeline -->
      <div class="bg-white rounded-2xl border border-gray-100 shadow-xl shadow-gray-200/40 p-8 flex-1 overflow-y-auto custom-scrollbar">
        <div class="relative border-l-2 border-gray-100 ml-4 space-y-12">
          @if (groupedActivities.length === 0 && !isLoading) {
            <div class="flex flex-col items-center justify-center py-20 text-gray-400 -ml-4">
                <mat-icon class="!w-16 !h-16 !text-[64px] mb-4 text-gray-100">history</mat-icon>
                <p class="text-sm font-bold text-gray-500">No hay actividad registrada aún</p>
            </div>
          }

          @for (group of groupedActivities; track group.date) {
            <div class="relative">
              <!-- Date Label -->
              <div class="absolute -left-[108px] top-0 w-24 text-right">
                <span class="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{{ group.date }}</span>
              </div>
              
              <div class="space-y-8 pl-8">
                @for (activity of group.items; track activity.id) {
                  <div class="relative group">
                    <!-- Icon Bubble -->
                    <div class="absolute -left-[45px] top-1 w-9 h-9 rounded-2xl bg-white border-2 border-gray-50 shadow-sm flex items-center justify-center z-10 transition-transform group-hover:scale-110 group-hover:shadow-md">
                      <mat-icon class="!w-4 !h-4 !text-[18px]" [class]="getIcon(activity.entity_type).color">
                        {{ getIcon(activity.entity_type).icon }}
                      </mat-icon>
                    </div>
                    
                    <div class="bg-gray-50/30 rounded-2xl p-4 border border-gray-50 transition-all group-hover:bg-white group-hover:border-brand-100 group-hover:shadow-lg group-hover:shadow-brand-500/5">
                      <div class="flex justify-between items-start mb-1">
                        <div class="text-sm text-gray-600 leading-relaxed">
                          <span class="font-bold text-gray-900">{{ activity.profiles?.full_name || 'Sistema' }}</span> 
                          <span class="mx-1 text-gray-500">{{ activity.action }}</span> 
                          <span class="font-bold text-brand-600 px-1.5 py-0.5 bg-brand-50 rounded-lg">{{ activity.entity_type | uppercase }}</span>
                        </div>
                        <span class="text-[10px] font-bold text-gray-400 uppercase tracking-tighter">{{ activity.created_at | date:'HH:mm' }}</span>
                      </div>
                      
                      @if (activity.details) {
                        <div class="mt-3 bg-white/80 p-3 rounded-xl border border-gray-100 text-[13px] text-gray-500 font-medium italic">
                            "{{ activity.details }}"
                        </div>
                      }
                    </div>
                  </div>
                }
              </div>
            </div>
          }
        </div>
        
        @if (groupedActivities.length > 0) {
            <div class="mt-12 text-center pb-4">
              <button class="px-6 py-2.5 bg-gray-50 border border-gray-100 text-gray-500 text-xs font-bold rounded-xl hover:bg-white hover:shadow-sm transition-all active:scale-95 uppercase tracking-widest">
                Cargar más actividad
              </button>
            </div>
        }
      </div>
    </div>
  `
})
export class ActivityComponent implements OnInit {
  private supabase = inject(SupabaseService);
  private cdr = inject(ChangeDetectorRef);

  activities: any[] = [];
  groupedActivities: any[] = [];
  isLoading = true;

  ngOnInit() {
    this.loadActivity();
  }

  async loadActivity() {
    this.isLoading = true;
    this.cdr.markForCheck();
    try {
      this.activities = await this.supabase.getActivityLogs();
      this.groupActivities();
    } catch (error) {
      console.error("Error loading activities:", error);
    } finally {
      this.isLoading = false;
      this.cdr.markForCheck();
    }
  }

  groupActivities() {
    const groups: { [key: string]: any[] } = {};
    const today = new Date().toDateString();
    const yesterday = new Date(Date.now() - 86400000).toDateString();

    this.activities.forEach(activity => {
      const date = new Date(activity.created_at);
      let dateKey = date.toDateString();

      if (dateKey === today) dateKey = 'Hoy';
      else if (dateKey === yesterday) dateKey = 'Ayer';
      else {
        dateKey = date.toLocaleDateString('es-ES', { day: '2-digit', month: 'short' }).replace('.', '');
      }

      if (!groups[dateKey]) groups[dateKey] = [];
      groups[dateKey].push(activity);
    });

    this.groupedActivities = Object.keys(groups).map(date => ({
      date,
      items: groups[date]
    }));
  }

  getIcon(type: string) {
    switch (type?.toLowerCase()) {
      case 'project': return { icon: 'folder', color: 'text-purple-500' };
      case 'task': return { icon: 'check_circle', color: 'text-brand-500' };
      case 'lead': return { icon: 'view_kanban', color: 'text-emerald-500' };
      case 'client': return { icon: 'business', color: 'text-blue-500' };
      case 'document': return { icon: 'upload_file', color: 'text-blue-400' };
      case 'meeting': return { icon: 'event', color: 'text-red-500' };
      default: return { icon: 'notifications', color: 'text-gray-400' };
    }
  }
}
