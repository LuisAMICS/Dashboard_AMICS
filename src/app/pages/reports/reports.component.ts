import { ChangeDetectionStrategy, ChangeDetectorRef, Component, inject, OnInit } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { CommonModule, CurrencyPipe, PercentPipe } from '@angular/common';
import { SupabaseService } from '../../core/services/supabase.service';

@Component({
  selector: 'app-reports',
  standalone: true,
  imports: [MatIconModule, CommonModule, CurrencyPipe, PercentPipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="space-y-6 relative h-full flex flex-col overflow-hidden">
      <!-- Loader Overlay -->
      @if (isLoading) {
        <div class="absolute inset-0 bg-white/60 backdrop-blur-[2px] z-50 flex items-center justify-center">
            <div class="flex flex-col items-center">
                <div class="w-12 h-12 border-4 border-brand-200 border-t-brand-600 rounded-full animate-spin"></div>
                <p class="mt-4 text-sm font-medium text-gray-600">Calculando métricas en tiempo real...</p>
            </div>
        </div>
      }

      <!-- Header -->
      <div class="flex items-center justify-between flex-shrink-0 px-1">
        <div>
          <h1 class="text-2xl font-display font-bold text-gray-900 tracking-tight">Reportes y Analítica</h1>
          <p class="text-sm text-gray-500 mt-1">Métricas clave del negocio extraídas de tu base de datos.</p>
        </div>
        <div class="flex items-center gap-3">
          <select class="px-3 py-2 bg-white border border-gray-200 text-gray-700 rounded-xl text-sm font-bold hover:bg-gray-50 outline-none shadow-sm cursor-pointer">
            <option>Tiempo Total</option>
            <option>Últimos 30 días</option>
          </select>
          <button class="flex items-center gap-2 bg-gray-900 hover:bg-gray-800 text-white px-4 py-2 rounded-xl text-sm font-bold transition-all shadow-sm active:scale-95">
            <mat-icon class="!w-4 !h-4 !text-[16px]">download</mat-icon>
            Exportar PDF
          </button>
        </div>
      </div>

      <div class="flex-1 overflow-y-auto pr-1 space-y-8 custom-scrollbar pb-4">
        <!-- KPI Summary -->
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          @for (kpi of kpis; track kpi.label) {
            <div class="bg-white p-6 rounded-2xl border border-gray-100 shadow-xl shadow-gray-200/30 hover:shadow-brand-500/5 transition-shadow">
              <p class="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">{{ kpi.label }}</p>
              <div class="flex items-baseline gap-2">
                <span class="text-2xl font-black text-gray-900">{{ kpi.value }}</span>
                @if (kpi.subtext) {
                    <span class="text-[10px] font-bold text-gray-400 uppercase">{{ kpi.subtext }}</span>
                }
              </div>
            </div>
          }
        </div>

        <div class="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <!-- Chart 1: Revenue by Project -->
          <div class="bg-white p-6 rounded-2xl border border-gray-100 shadow-xl shadow-gray-200/30">
            <div class="flex justify-between items-center mb-8">
              <h3 class="text-lg font-bold text-gray-900 tracking-tight">Inversión por Proyecto</h3>
              <mat-icon class="text-gray-300">assessment</mat-icon>
            </div>
            
            <div class="space-y-6">
                @for (p of projectRevenue; track p.name) {
                    <div>
                        <div class="flex justify-between text-xs font-bold mb-2">
                            <span class="text-gray-600 uppercase tracking-tighter">{{ p.name }}</span>
                            <span class="text-gray-900">{{ p.budget | currency:'EUR':'symbol':'1.0-0' }}</span>
                        </div>
                        <div class="w-full bg-gray-100 rounded-full h-2 overflow-hidden">
                            <div class="bg-brand-500 h-full rounded-full transition-all duration-1000" [style.width]="p.percentage + '%'"></div>
                        </div>
                    </div>
                }
                @if (projectRevenue.length === 0) {
                    <div class="py-10 text-center text-gray-400 text-sm font-medium">No hay proyectos registrados</div>
                }
            </div>
          </div>

          <!-- Chart 2: Conversión Funnel (Leads) -->
          <div class="bg-white p-6 rounded-2xl border border-gray-100 shadow-xl shadow-gray-200/30">
            <div class="flex justify-between items-center mb-8">
              <h3 class="text-lg font-bold text-gray-900 tracking-tight">Pipeline de Ventas (Leads)</h3>
              <mat-icon class="text-gray-300">filter_alt</mat-icon>
            </div>
            
            <div class="space-y-4">
              @for (stage of funnelData; track stage.label) {
                <div class="group">
                  <div class="flex justify-between text-xs font-bold mb-1.5 px-1 transition-all group-hover:translate-x-1">
                    <span class="text-gray-500 uppercase tracking-widest">{{ stage.label }}</span>
                    <div class="flex items-center gap-2">
                        @if (stage.count > 0) {
                            <span class="text-gray-900">{{ stage.count }} leads</span>
                        }
                        <span class="text-brand-500 font-black">{{ stage.percentage | number:'1.0-0' }}%</span>
                    </div>
                  </div>
                  <div class="w-full bg-gray-50 rounded-xl h-4 overflow-hidden border border-gray-100">
                    <div [class]="'h-full rounded-xl transition-all duration-1000 ' + stage.color" [style.width]="stage.percentage + '%'"></div>
                  </div>
                </div>
              }
            </div>
          </div>
        </div>

        <!-- Rendimiento de Tareas -->
        <div class="bg-white rounded-2xl border border-gray-100 shadow-xl shadow-gray-200/30 overflow-hidden">
          <div class="p-6 border-b border-gray-100 flex items-center justify-between">
            <h3 class="text-lg font-bold text-gray-900 tracking-tight">Estado de Tareas Globals</h3>
            <div class="flex items-center gap-4">
                <div class="flex items-center gap-2 text-[10px] font-bold text-gray-500"><span class="w-2 h-2 rounded-full bg-emerald-500"></span> Completadas</div>
                <div class="flex items-center gap-2 text-[10px] font-bold text-gray-500"><span class="w-2 h-2 rounded-full bg-brand-400"></span> Pendientes</div>
            </div>
          </div>
          <div class="p-8">
            <div class="flex items-center gap-1.5 h-12 w-full bg-gray-100 rounded-2xl overflow-hidden p-1 shadow-inner">
                @for (stat of taskStats; track stat.label) {
                    <div 
                        class="h-full first:rounded-l-xl last:rounded-r-xl transition-all duration-1000 flex items-center justify-center text-[10px] font-black text-white shadow-sm"
                        [class]="stat.color"
                        [style.width]="stat.percentage + '%'"
                        [title]="stat.label">
                        @if (stat.percentage > 10) {
                            {{ stat.percentage | number:'1.1-1' }}%
                        }
                    </div>
                }
            </div>
            <div class="grid grid-cols-4 gap-4 mt-8">
                @for (stat of taskStats; track stat.label) {
                    <div class="text-center">
                        <p class="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">{{ stat.label }}</p>
                        <p class="text-xl font-black text-gray-900">{{ stat.count }}</p>
                    </div>
                }
            </div>
          </div>
        </div>
      </div>
    </div>
  `
})
export class ReportsComponent implements OnInit {
  private supabase = inject(SupabaseService);
  private cdr = inject(ChangeDetectorRef);

  isLoading = true;
  kpis: any[] = [];
  projectRevenue: any[] = [];
  funnelData: any[] = [];
  taskStats: any[] = [];

  ngOnInit() {
    this.calculateStats();
  }

  async calculateStats() {
    this.isLoading = true;
    this.cdr.markForCheck();
    try {
      const stats = await this.supabase.getReportStats();

      this.processKPIs(stats);
      this.processProjectRevenue(stats);
      this.processFunnel(stats);
      this.processTasks(stats);

    } catch (error) {
      console.error("Error generating reports:", error);
    } finally {
      this.isLoading = false;
      this.cdr.markForCheck();
    }
  }

  processKPIs(stats: any) {
    const totalRevenue = stats.projects.reduce((sum: number, p: any) => sum + (Number(p.budget) || 0), 0);
    const totalLeads = stats.leads.length;
    const closedWon = stats.leads.filter((l: any) => l.status === 'closed_won').length;
    const convRate = totalLeads > 0 ? (closedWon / totalLeads) * 100 : 0;
    const activeProjects = stats.projects.filter((p: any) => p.status === 'active').length;

    this.kpis = [
      { label: 'Ingresos Totales', value: `€${(totalRevenue / 1000).toFixed(1)}k`, subtext: 'Estimado YTD' },
      { label: 'Conversión', value: `${convRate.toFixed(1)}%`, subtext: 'Leads a Ganados' },
      { label: 'Proyectos Activos', value: activeProjects.toString(), subtext: 'En curso' },
      { label: 'Oportunidades', value: totalLeads.toString(), subtext: 'Leads en Pipeline' },
    ];
  }

  processProjectRevenue(stats: any) {
    const totalBudget = stats.projects.reduce((sum: number, p: any) => sum + (Number(p.budget) || 0), 0) || 1;
    this.projectRevenue = stats.projects.map((p: any) => ({
      name: p.name || `Proyecto #${p.id.slice(0, 4)}`,
      budget: p.budget || 0,
      percentage: ((p.budget || 0) / totalBudget) * 100
    })).sort((a: any, b: any) => b.budget - a.budget).slice(0, 5);
  }

  processFunnel(stats: any) {
    const totalLeads = stats.leads.length || 1;
    const getCount = (status: string) => stats.leads.filter((l: any) => l.status === status).length;

    this.funnelData = [
      { label: 'Nuevos', count: getCount('new'), percentage: (getCount('new') / totalLeads) * 100, color: 'bg-blue-400 shadow-blue-200' },
      { label: 'Reunión', count: getCount('meeting'), percentage: (getCount('meeting') / totalLeads) * 100, color: 'bg-purple-400 shadow-purple-200' },
      { label: 'Propuesta', count: getCount('proposal'), percentage: (getCount('proposal') / totalLeads) * 100, color: 'bg-brand-400 shadow-brand-200' },
      { label: 'Ganados', count: getCount('closed_won'), percentage: (getCount('closed_won') / totalLeads) * 100, color: 'bg-emerald-400 shadow-emerald-200' },
    ];
  }

  processTasks(stats: any) {
    const totalTasks = stats.tasks.length || 1;
    const getCount = (status: string) => stats.tasks.filter((t: any) => t.status === status).length;

    this.taskStats = [
      { label: 'Pendientes', count: getCount('pending'), percentage: (getCount('pending') / totalTasks) * 100, color: 'bg-gray-400' },
      { label: 'En Proceso', count: getCount('in_progress'), percentage: (getCount('in_progress') / totalTasks) * 100, color: 'bg-brand-400' },
      { label: 'Completadas', count: getCount('completed'), percentage: (getCount('completed') / totalTasks) * 100, color: 'bg-emerald-500' },
      { label: 'Revisión', count: getCount('review'), percentage: (getCount('review') / totalTasks) * 100, color: 'bg-purple-500' },
    ];
  }
}
