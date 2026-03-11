import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { SupabaseService } from '../../core/services/supabase.service';
import { FormsModule } from '@angular/forms';
import { CurrencyPipe, DatePipe, NgClass } from '@angular/common';

@Component({
  selector: 'app-projects',
  standalone: true,
  imports: [MatIconModule, FormsModule, CurrencyPipe, NgClass, DatePipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="space-y-6 relative h-full flex flex-col overflow-hidden pb-4">
      <!-- Header -->
      <div class="flex items-center justify-between flex-shrink-0">
        <div>
          <h1 class="text-2xl font-display font-bold text-gray-900 tracking-tight">Proyectos</h1>
          <p class="text-sm text-gray-500 mt-1">Supervisa el estado y avance de todos los proyectos activos.</p>
        </div>
        <div class="flex items-center gap-3">
          <div class="flex bg-gray-100 p-1 rounded-lg">
            <button class="px-3 py-1.5 bg-white shadow-sm rounded-md text-sm font-medium text-gray-900 flex items-center gap-2">
              <mat-icon class="!w-4 !h-4 !text-[16px]">grid_view</mat-icon> Grid
            </button>
            <button class="px-3 py-1.5 text-gray-600 hover:text-gray-900 rounded-md text-sm font-medium flex items-center gap-2 transition-colors">
              <mat-icon class="!w-4 !h-4 !text-[16px]">table_rows</mat-icon> Lista
            </button>
          </div>
          <button type="button" (click)="openNewProject()" class="flex items-center gap-2 bg-brand-600 hover:bg-brand-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors shadow-sm cursor-pointer">
            <mat-icon class="!w-4 !h-4 !text-[16px]">add</mat-icon>
            Nuevo Proyecto
          </button>
          <button type="button" (click)="loadData()" class="flex items-center gap-2 px-3 py-2 bg-white border border-gray-200 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors shadow-sm cursor-pointer">
            <mat-icon class="!w-4 !h-4 !text-[16px]">refresh</mat-icon>
          </button>
        </div>
      </div>

      <!-- Filters -->
      <div class="flex items-center gap-4 flex-shrink-0">
        <div class="relative flex-1 max-w-md">
          <mat-icon class="absolute left-3 top-1/2 -translate-y-1/2 !w-4 !h-4 !text-[16px] text-gray-400">search</mat-icon>
          <input type="text" placeholder="Buscar proyectos..." class="w-full pl-9 pr-4 py-2 bg-white border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 outline-none transition-all shadow-sm" />
        </div>
        <select class="px-3 py-2 bg-white border border-gray-200 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-50 outline-none shadow-sm">
          <option>Todos los estados</option>
          <option>En desarrollo</option>
          <option>En revisión</option>
          <option>Completado</option>
        </select>
      </div>

      <!-- Projects Grid -->
      <div class="flex-1 overflow-y-auto">
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pb-6">
          @for (project of projects; track project.id) {
            <div (click)="openEditProject(project)" class="bg-white rounded-xl border border-gray-200 shadow-sm hover:shadow-md hover:border-brand-300 transition-all cursor-pointer flex flex-col h-full group">
              <div class="p-5 border-b border-gray-100 flex-1 flex flex-col">
                <div class="flex justify-between items-start mb-4">
                  <span class="inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-medium" [class]="getStatusColor(project.status)">
                    {{ getStatusLabel(project.status) }}
                  </span>
                  <button type="button" class="text-gray-300 hover:text-brand-600 opacity-0 group-hover:opacity-100 transition-opacity">
                    <mat-icon class="!w-4 !h-4 !text-[16px]">edit</mat-icon>
                  </button>
                </div>
                
                <h3 class="text-lg font-semibold text-gray-900 mb-1 group-hover:text-brand-600 transition-colors">{{ project.name }}</h3>
                <p class="text-sm text-gray-500 mb-4">{{ project.clients?.company_name || 'Sin cliente asignado' }}</p>
                
                <p class="text-sm text-gray-600 line-clamp-2 mb-6 flex-1">{{ project.description || 'Sin descripción' }}</p>
                
                <div class="space-y-2 mt-auto">
                  <div class="flex justify-between text-sm">
                    <span class="font-medium text-gray-700">Progreso</span>
                    <span class="font-semibold text-gray-900">{{ project.progress || 0 }}%</span>
                  </div>
                  <div class="w-full bg-gray-100 rounded-full h-2">
                    <div class="bg-brand-500 h-2 rounded-full" [style.width]="(project.progress || 0) + '%'"></div>
                  </div>
                </div>
              </div>
              
              <div class="px-5 py-4 bg-gray-50/50 rounded-b-xl flex items-center justify-between border-t border-gray-100">
                <div class="flex items-center gap-3 text-xs text-gray-500">
                  <div class="flex items-center gap-1" title="Tareas">
                    <mat-icon class="!w-4 !h-4 !text-[16px]">check_circle</mat-icon>
                    {{ project.tasks_completed || 0 }}/{{ project.tasks_total || 0 }}
                  </div>
                  <div class="flex items-center gap-1" title="Fecha límite">
                    <mat-icon class="!w-4 !h-4 !text-[16px]">event</mat-icon>
                    {{ project.end_date ? (project.end_date | date:'dd MMM') : 'Sin fecha' }}
                  </div>
                </div>
                <div class="flex -space-x-2">
                  @for (avatar of project.team; track avatar) {
                    <img [src]="avatar || 'https://i.pravatar.cc/150'" class="w-7 h-7 rounded-full border-2 border-white bg-white" alt="Team member" referrerpolicy="no-referrer" />
                  }
                  @if (!project.team || project.team.length === 0) {
                      <div class="w-7 h-7 rounded-full border-2 border-white bg-gray-200 flex items-center justify-center text-[10px] text-gray-500">
                          -
                      </div>
                  }
                </div>
              </div>
            </div>
          }
          @if (projects.length === 0 && !isLoadingData) {
              <div class="col-span-full py-12 text-center">
                  <p class="text-gray-500">No hay proyectos encontrados.</p>
              </div>
          }
        </div>
      </div>

      <!-- OVERLAY PANEL -->
      @if (isPanelOpen) {
          <div class="fixed inset-0 bg-gray-900/40 z-40 transition-opacity backdrop-blur-sm" (click)="closePanel()"></div>
          
          <div class="fixed inset-y-0 right-0 z-50 w-full max-w-md bg-white border-l border-gray-200 shadow-2xl transform transition-transform overflow-y-auto flex flex-col">
              <!-- Panel Header -->
              <div class="px-6 py-5 border-b border-gray-100 flex items-center justify-between bg-gray-50/50 sticky top-0 z-10">
                  <div>
                      <h2 class="text-lg font-semibold text-gray-900">{{ isEditing ? 'Editar Proyecto' : 'Nuevo Proyecto' }}</h2>
                      <p class="text-xs text-gray-500 mt-0.5">{{ isEditing ? currentProject.name : 'Configura los detalles del proyecto' }}</p>
                  </div>
                  <button type="button" (click)="closePanel()" class="text-gray-400 hover:text-gray-600 transition-colors p-1 rounded-md hover:bg-gray-100 cursor-pointer">
                      <mat-icon class="!w-5 !h-5 !text-[20px]">close</mat-icon>
                  </button>
              </div>

              <!-- Panel Form -->
              <div class="p-6 flex-1 space-y-5">
                  @if (errorMessage) {
                    <div class="bg-red-50 text-red-600 text-sm px-4 py-3 rounded-lg border border-red-100 mb-4">
                        {{ errorMessage }}
                    </div>
                  }
                  
                  <div>
                      <label class="block text-sm font-medium text-gray-700 mb-1">Nombre del Proyecto *</label>
                      <input type="text" [(ngModel)]="currentProject.name" class="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 outline-none transition-all" placeholder="Ej. Implementación CRM AI" />
                  </div>

                  <div>
                      <label class="block text-sm font-medium text-gray-700 mb-1">Cliente</label>
                      <select [(ngModel)]="currentProject.client_id" class="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 outline-none transition-all bg-white">
                          <option [ngValue]="null">-- Sin cliente asignado --</option>
                          @for(client of clientsList; track client.id) {
                              <option [ngValue]="client.id">{{ client.company_name }}</option>
                          }
                      </select>
                  </div>
                  
                  <div>
                      <label class="block text-sm font-medium text-gray-700 mb-1">Descripción</label>
                      <textarea [(ngModel)]="currentProject.description" rows="3" class="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 outline-none transition-all resize-none" placeholder="Breve resumen del proyecto..."></textarea>
                  </div>

                  <div class="grid grid-cols-2 gap-4">
                      <div>
                          <label class="block text-sm font-medium text-gray-700 mb-1">Estado</label>
                          <select [(ngModel)]="currentProject.status" class="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 outline-none transition-all bg-white">
                              <option value="briefing">Briefing</option>
                              <option value="planning">Planificación</option>
                              <option value="in_progress">En desarrollo</option>
                              <option value="review">En revisión</option>
                              <option value="completed">Completado</option>
                              <option value="on_hold">En pausa</option>
                          </select>
                      </div>
                      <div>
                          <label class="block text-sm font-medium text-gray-700 mb-1">Progreso (%)</label>
                          <input type="number" min="0" max="100" [(ngModel)]="currentProject.progress" class="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 outline-none transition-all" placeholder="0" />
                      </div>
                  </div>

                  <div class="grid grid-cols-2 gap-4">
                      <div>
                          <label class="block text-sm font-medium text-gray-700 mb-1">Tareas (Hechas)</label>
                          <input type="number" min="0" [(ngModel)]="currentProject.tasks_completed" class="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 outline-none transition-all" />
                      </div>
                      <div>
                          <label class="block text-sm font-medium text-gray-700 mb-1">Tareas (Total)</label>
                          <input type="number" min="0" [(ngModel)]="currentProject.tasks_total" class="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 outline-none transition-all" />
                      </div>
                  </div>

                  <div class="grid grid-cols-2 gap-4">
                      <div>
                          <label class="block text-sm font-medium text-gray-700 mb-1">Fecha Inicio</label>
                          <input type="date" [(ngModel)]="currentProject.start_date" class="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 outline-none transition-all" />
                      </div>
                      <div>
                          <label class="block text-sm font-medium text-gray-700 mb-1">Fecha Fin</label>
                          <input type="date" [(ngModel)]="currentProject.end_date" class="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 outline-none transition-all" />
                      </div>
                  </div>

                  <div>
                      <label class="block text-sm font-medium text-gray-700 mb-1">Presupuesto (€)</label>
                      <input type="number" [(ngModel)]="currentProject.budget" class="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 outline-none transition-all" placeholder="Añade el presupuesto..." />
                  </div>
                  
                  @if(isEditing && currentProject.id) {
                      <div class="pt-4 mt-2">
                        <button type="button" (click)="deleteProject($event)" [disabled]="isSaving" class="text-sm text-red-600 hover:text-red-700 font-medium cursor-pointer flex items-center gap-1">
                            <mat-icon class="!w-4 !h-4 !text-[16px]">delete</mat-icon> Eliminar proyecto
                        </button>
                      </div>
                  }
              </div>

              <!-- Panel Footer -->
              <div class="px-6 py-4 border-t border-gray-200 bg-gray-50 flex items-center justify-end gap-3 sticky bottom-0">
                  <button type="button" (click)="closePanel()" [disabled]="isSaving" class="px-4 py-2 bg-white border border-gray-200 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors shadow-sm cursor-pointer">
                      Cancelar
                  </button>
                  <button type="button" (click)="saveProject()" [disabled]="isSaving || !currentProject.name" class="px-4 py-2 bg-brand-600 border border-transparent text-white rounded-lg text-sm font-medium hover:bg-brand-700 transition-colors shadow-sm cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2">
                      @if(isSaving){
						  <mat-icon class="!w-4 !h-4 !text-[16px] animate-spin">sync</mat-icon>
                      }
                      {{ isEditing ? 'Guardar Cambios' : 'Crear Proyecto' }}
                  </button>
              </div>
          </div>
      }
    </div>
  `
})
export class ProjectsComponent implements OnInit {
  projects: any[] = [];
  clientsList: any[] = [];
  isLoadingData = true;

  // Panel state
  isPanelOpen = false;
  isEditing = false;
  isSaving = false;
  errorMessage = '';
  currentProject: any = {};

  constructor(
    private supabase: SupabaseService,
    private cdr: ChangeDetectorRef
  ) { }

  ngOnInit() {
    this.loadData();
  }

  async loadData() {
    this.isLoadingData = true;
    this.cdr.markForCheck();
    try {
      // Fetch concurrent
      const [projectsData, clientsData] = await Promise.all([
        this.supabase.getProjects(),
        this.supabase.getClients()
      ]);
      this.projects = projectsData;
      this.clientsList = clientsData;
    } catch (error) {
      console.error("Error al cargar datos:", error);
    } finally {
      this.isLoadingData = false;
      this.cdr.markForCheck();
    }
  }

  getStatusLabel(status: string): string {
    const map: any = {
      'briefing': 'Briefing',
      'planning': 'Planificación',
      'in_progress': 'En desarrollo',
      'review': 'En revisión',
      'completed': 'Completado',
      'on_hold': 'En pausa'
    };
    return map[status] || 'Desconocido';
  }

  getStatusColor(status: string): string {
    const map: any = {
      'briefing': 'bg-gray-50 text-gray-700 border border-gray-200',
      'planning': 'bg-purple-50 text-purple-700 border border-purple-200',
      'in_progress': 'bg-blue-50 text-blue-700 border border-blue-200',
      'review': 'bg-amber-50 text-amber-700 border border-amber-200',
      'completed': 'bg-emerald-50 text-emerald-700 border border-emerald-200',
      'on_hold': 'bg-red-50 text-red-700 border border-red-200'
    };
    return map[status] || 'bg-gray-100 text-gray-800';
  }

  openNewProject() {
    this.isEditing = false;
    this.currentProject = {
      name: '',
      client_id: null,
      description: '',
      status: 'planning',
      start_date: null,
      end_date: null,
      budget: 0,
      progress: 0,
      tasks_completed: 0,
      tasks_total: 0,
      team: [] // Initialize with empty array for avatars
    };
    this.errorMessage = '';
    this.isPanelOpen = true;
    this.cdr.markForCheck();
  }

  openEditProject(project: any) {
    this.isEditing = true;
    this.currentProject = { ...project }; // shallow copy
    this.errorMessage = '';
    this.isPanelOpen = true;
    this.cdr.markForCheck();
  }

  closePanel() {
    this.isPanelOpen = false;
    this.cdr.markForCheck();
  }

  async saveProject() {
    if (!this.currentProject.name?.trim()) {
      this.errorMessage = 'El nombre del proyecto es obligatorio.';
      return;
    }

    this.isSaving = true;
    this.errorMessage = '';
    this.cdr.markForCheck();

    try {
      const payload: any = {
        name: this.currentProject.name,
        client_id: this.currentProject.client_id || null,
        description: this.currentProject.description,
        status: this.currentProject.status,
        progress: this.currentProject.progress,
        tasks_completed: this.currentProject.tasks_completed,
        tasks_total: this.currentProject.tasks_total,
        budget: this.currentProject.budget,
        team: this.currentProject.team || []
      };

      if (this.currentProject.start_date) payload.start_date = this.currentProject.start_date;
      if (this.currentProject.end_date) payload.end_date = this.currentProject.end_date;

      console.log('Guardando proyecto con payload:', payload);

      let result;
      if (this.isEditing && this.currentProject.id) {
        result = await this.supabase.updateProject(this.currentProject.id, payload);
      } else {
        result = await this.supabase.createProject(payload);
      }

      console.log('Resultado del guardado:', result);
      this.closePanel();
      await this.loadData();
    } catch (error: any) {
      console.error("Error detallado guardando proyecto:", error);
      this.errorMessage = error.message || error.details || 'Error desconocido al guardar.';
      if (error.hint) {
        this.errorMessage += ` (Hint: ${error.hint})`;
      }
    } finally {
      this.isSaving = false;
      this.cdr.markForCheck();
    }
  }

  async deleteProject(event: Event) {
    event.stopPropagation();
    event.preventDefault();

    if (!confirm('¿Estás seguro de que deseas eliminar este Proyecto?')) return;

    this.isSaving = true;
    this.cdr.markForCheck();

    try {
      await this.supabase.deleteProject(this.currentProject.id);
      this.closePanel();
      await this.loadData();
    } catch (error) {
      console.error("Error eliminando proyecto:", error);
      this.errorMessage = 'Hubo un error al eliminar el proyecto.';
    } finally {
      this.isSaving = false;
      this.cdr.markForCheck();
    }
  }
}
