import { ChangeDetectionStrategy, ChangeDetectorRef, Component, inject, OnInit } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SupabaseService } from '../../core/services/supabase.service';

@Component({
  selector: 'app-tasks',
  standalone: true,
  imports: [MatIconModule, CommonModule, FormsModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="h-full flex flex-col relative overflow-hidden">
      <!-- Loader Overlay -->
      @if (isLoading) {
        <div class="absolute inset-0 bg-white/60 backdrop-blur-[2px] z-50 flex items-center justify-center">
            <div class="flex flex-col items-center">
                <div class="w-12 h-12 border-4 border-brand-200 border-t-brand-600 rounded-full animate-spin"></div>
                <p class="mt-4 text-sm font-medium text-gray-600">Actualizando tablero...</p>
            </div>
        </div>
      }

      <!-- Header -->
      <div class="flex items-center justify-between mb-6 flex-shrink-0 px-1">
        <div>
          <h1 class="text-2xl font-display font-bold text-gray-900 tracking-tight">Mis Tareas</h1>
          <p class="text-sm text-gray-500 mt-1">Organiza y prioriza el trabajo en equipo.</p>
        </div>
        <div class="flex items-center gap-3">
          <div class="flex bg-gray-100 p-1 rounded-lg">
            <button class="px-3 py-1.5 bg-white shadow-sm rounded-md text-sm font-medium text-gray-900 flex items-center gap-2">
              <mat-icon class="!w-4 !h-4 !text-[16px]">view_kanban</mat-icon> Tablero
            </button>
            <button class="px-3 py-1.5 text-gray-600 hover:text-gray-900 rounded-md text-sm font-medium flex items-center gap-2 transition-colors">
              <mat-icon class="!w-4 !h-4 !text-[16px]">list</mat-icon> Lista
            </button>
          </div>
          <button (click)="openNewTaskPanel()" class="flex items-center gap-2 bg-brand-600 hover:bg-brand-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors shadow-sm active:scale-95">
            <mat-icon class="!w-4 !h-4 !text-[16px]">add</mat-icon>
            Nueva Tarea
          </button>
        </div>
      </div>

      <!-- Filters -->
      <div class="flex items-center gap-4 mb-6 flex-shrink-0 px-1">
        <div class="relative flex-1 max-w-xs text-gray-400 focus-within:text-brand-500">
          <mat-icon class="absolute left-3 top-1/2 -translate-y-1/2 !w-4 !h-4 !text-[16px] transition-colors">search</mat-icon>
          <input type="text" placeholder="Buscar tareas..." class="w-full pl-9 pr-4 py-2 bg-white border border-gray-200 rounded-xl text-sm focus:ring-4 focus:ring-brand-500/10 focus:border-brand-500 outline-none transition-all shadow-sm placeholder:text-gray-400" />
        </div>
        <button class="px-4 py-2 bg-white border border-gray-200 text-gray-700 rounded-xl text-sm font-medium hover:bg-gray-50 flex items-center gap-2 transition-all shadow-sm active:scale-95">
          <mat-icon class="!w-4 !h-4 !text-[16px]">person</mat-icon> Asignado a mí
        </button>
        <button class="px-4 py-2 bg-white border border-gray-200 text-gray-700 rounded-xl text-sm font-medium hover:bg-gray-50 flex items-center gap-2 transition-all shadow-sm active:scale-95">
          <mat-icon class="!w-4 !h-4 !text-[16px]">folder</mat-icon> Proyecto
        </button>
      </div>

      <!-- Task Board -->
      <div class="flex-1 overflow-x-auto overflow-y-hidden pb-4 -mx-1 px-1">
        <div class="flex gap-6 h-full min-w-max pb-2">
          @for (column of boardColumns; track column.status) {
            <div class="w-80 flex flex-col h-full bg-gray-50/50 rounded-2xl border border-gray-200/60 shadow-sm">
              <!-- Column Header -->
              <div class="p-4 flex items-center justify-between flex-shrink-0">
                <div class="flex items-center gap-2.5">
                  <span class="w-2.5 h-2.5 rounded-full shadow-sm" [class]="column.colorClass"></span>
                  <h3 class="font-bold text-gray-800 tracking-tight">{{ column.name }}</h3>
                  <span class="bg-gray-200/70 text-gray-600 text-[11px] font-bold px-2 py-0.5 rounded-full">{{ getColumnTasks(column.status).length }}</span>
                </div>
                <button (click)="openNewTaskPanel(column.status)" class="w-6 h-6 flex items-center justify-center rounded-lg hover:bg-white hover:shadow-sm text-gray-400 hover:text-brand-600 transition-all">
                  <mat-icon class="!w-5 !h-5 !text-[20px]">add</mat-icon>
                </button>
              </div>

              <!-- Tasks List -->
              <div class="flex-1 overflow-y-auto p-3 space-y-3 custom-scrollbar">
                @for (task of getColumnTasks(column.status); track task.id) {
                  <article 
                    (click)="editTask(task)"
                    class="bg-white p-4 rounded-xl border border-gray-200 shadow-sm hover:shadow-xl hover:shadow-brand-500/5 hover:border-brand-400/50 hover:-translate-y-0.5 transition-all cursor-pointer group">
                    <div class="flex justify-between items-start mb-3">
                      <span class="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider shadow-sm" [class]="getPriorityClass(task.priority)">
                        {{ task.priority }}
                      </span>
                      <mat-icon class="!w-4 !h-4 !text-[16px] text-gray-300 opacity-0 group-hover:opacity-100 transition-opacity">drag_indicator</mat-icon>
                    </div>
                    
                    <h4 class="font-bold text-gray-900 text-[13px] leading-snug mb-1 group-hover:text-brand-600 transition-colors line-clamp-2">{{ task.title }}</h4>
                    <div class="flex items-center gap-1.5 text-[11px] text-gray-500 font-medium">
                        <mat-icon class="!w-3 !h-3 !text-[12px]">folder_open</mat-icon>
                        {{ task.projects?.name || 'Varios' }}
                    </div>
                    
                    <div class="flex items-center justify-between mt-4 pt-3 border-t border-gray-50">
                      <div class="flex items-center gap-3 text-[11px] text-gray-500 font-medium">
                        <div class="flex items-center gap-1">
                          <mat-icon class="!w-3.5 !h-3.5 !text-[14px]">calendar_today</mat-icon>
                          {{ task.due_date ? (task.due_date | date:'dd MMM') : 'S/F' }}
                        </div>
                      </div>
                      <div class="flex -space-x-2">
                        <img 
                            [src]="task.profiles?.avatar_url || 'https://i.pravatar.cc/150?u=' + task.id" 
                            class="w-6 h-6 rounded-full border-2 border-white shadow-sm" 
                            [title]="task.profiles?.full_name || 'Sin asignar'"
                            alt="Assignee" 
                            referrerpolicy="no-referrer" />
                      </div>
                    </div>
                  </article>
                }

                @if (getColumnTasks(column.status).length === 0) {
                    <div class="flex flex-col items-center justify-center py-8 text-gray-300">
                        <mat-icon class="!w-8 !h-8 !text-[32px] mb-2">inbox</mat-icon>
                        <p class="text-[11px] font-medium">Sin tareas</p>
                    </div>
                }
              </div>
            </div>
          }
        </div>
      </div>

      <!-- Detail/Create Sidebar -->
      <div 
        class="fixed inset-y-0 right-0 w-full max-w-md bg-white shadow-2xl z-[100] transform transition-transform duration-300 ease-out border-l border-gray-100 flex flex-col"
        [class.translate-x-full]="!isPanelOpen">
        
        <div class="p-6 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
          <div>
            <h2 class="text-xl font-display font-bold text-gray-900">{{ isEditing ? 'Editar Tarea' : 'Nueva Tarea' }}</h2>
            <p class="text-xs text-gray-500 mt-0.5">Define los detalles y responsabilidades.</p>
          </div>
          <button (click)="closePanel()" class="w-10 h-10 flex items-center justify-center rounded-xl hover:bg-gray-200 text-gray-500 transition-colors">
            <mat-icon>close</mat-icon>
          </button>
        </div>

        <div class="flex-1 overflow-y-auto p-6 space-y-6">
            @if (errorMessage) {
                <div class="bg-red-50 border border-red-100 text-red-700 p-4 rounded-xl text-sm flex items-start gap-3 animate-in fade-in slide-in-from-top-2">
                    <mat-icon class="!w-5 !h-5 !text-[20px]">error_outline</mat-icon>
                    <p>{{ errorMessage }}</p>
                </div>
            }

            <div class="space-y-1.5">
                <label class="text-xs font-bold text-gray-700 uppercase tracking-wider">Título de la Tarea</label>
                <input [(ngModel)]="currentTask.title" type="text" placeholder="Ej: Implementar pasarela de pago" class="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:ring-4 focus:ring-brand-500/10 focus:border-brand-500 outline-none transition-all bg-gray-50/30 font-medium" />
            </div>

            <div class="grid grid-cols-2 gap-4">
                <div class="space-y-1.5">
                    <label class="text-xs font-bold text-gray-700 uppercase tracking-wider">Proyecto</label>
                    <select [(ngModel)]="currentTask.project_id" class="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:ring-4 focus:ring-brand-500/10 focus:border-brand-500 outline-none transition-all bg-white font-medium">
                        <option [ngValue]="null">-- Seleccionar Proyecto --</option>
                        @for(p of projectsList; track p.id) {
                            <option [ngValue]="p.id">{{ p.name }}</option>
                        }
                    </select>
                </div>
                <div class="space-y-1.5">
                    <label class="text-xs font-bold text-gray-700 uppercase tracking-wider">Responsable</label>
                    <select [(ngModel)]="currentTask.assigned_to" class="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:ring-4 focus:ring-brand-500/10 focus:border-brand-500 outline-none transition-all bg-white font-medium">
                        <option [ngValue]="null">-- Sin asignar --</option>
                        @for(u of usersList; track u.id) {
                            <option [ngValue]="u.id">{{ u.full_name }}</option>
                        }
                    </select>
                </div>
            </div>

            <div class="grid grid-cols-2 gap-4">
                <div class="space-y-1.5">
                    <label class="text-xs font-bold text-gray-700 uppercase tracking-wider">Estado</label>
                    <select [(ngModel)]="currentTask.status" class="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:ring-4 focus:ring-brand-500/10 focus:border-brand-500 outline-none transition-all bg-white font-medium">
                        @for(col of boardColumns; track col.status) {
                            <option [value]="col.status">{{ col.name }}</option>
                        }
                    </select>
                </div>
                <div class="space-y-1.5">
                    <label class="text-xs font-bold text-gray-700 uppercase tracking-wider">Prioridad</label>
                    <select [(ngModel)]="currentTask.priority" class="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:ring-4 focus:ring-brand-500/10 focus:border-brand-500 outline-none transition-all bg-white font-medium">
                        <option value="low">Baja</option>
                        <option value="medium">Media</option>
                        <option value="high">Alta</option>
                        <option value="urgent">Urgente</option>
                    </select>
                </div>
            </div>

            <div class="space-y-1.5">
                <label class="text-xs font-bold text-gray-700 uppercase tracking-wider">Fecha de entrega</label>
                <input [(ngModel)]="currentTask.due_date" type="date" class="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:ring-4 focus:ring-brand-500/10 focus:border-brand-500 outline-none transition-all bg-white font-medium" />
            </div>

            <div class="space-y-1.5">
                <label class="text-xs font-bold text-gray-700 uppercase tracking-wider">Descripción (Opcional)</label>
                <textarea 
                    [(ngModel)]="currentTask.description" 
                    rows="4" 
                    placeholder="Describe los pasos a seguir o detalles importantes..." 
                    class="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:ring-4 focus:ring-brand-500/10 focus:border-brand-500 outline-none transition-all bg-white resize-none"></textarea>
            </div>
        </div>

        <div class="p-6 border-t border-gray-100 flex items-center gap-3">
          @if (isEditing) {
            <button 
                (click)="deleteTask()"
                [disabled]="isSaving"
                class="w-12 h-12 flex items-center justify-center border border-red-200 text-red-500 rounded-xl hover:bg-red-50 transition-colors disabled:opacity-50">
                <mat-icon>delete_outline</mat-icon>
            </button>
          }
          <button (click)="closePanel()" class="flex-1 py-3 border border-gray-200 text-gray-700 rounded-xl text-sm font-bold hover:bg-gray-50 transition-all active:scale-95">
            Cancelar
          </button>
          <button 
            (click)="saveTask()"
            [disabled]="isSaving"
            class="flex-[2] py-3 bg-brand-600 hover:bg-brand-700 text-white rounded-xl text-sm font-bold transition-all shadow-lg shadow-brand-500/20 active:scale-95 disabled:bg-brand-400 flex items-center justify-center gap-2">
            @if (isSaving) {
                <div class="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
            }
            {{ isEditing ? 'Guardar Cambios' : 'Crear Tarea' }}
          </button>
        </div>
      </div>

    </div>
  `
})
export class TasksComponent implements OnInit {
  private supabase = inject(SupabaseService);
  private cdr = inject(ChangeDetectorRef);

  taskList: any[] = [];
  projectsList: any[] = [];
  usersList: any[] = [];
  isLoading = true;
  isSaving = false;
  errorMessage = '';

  isPanelOpen = false;
  isEditing = false;
  currentTask: any = {};

  boardColumns = [
    { status: 'pending', name: 'Pendiente', colorClass: 'bg-gray-400' },
    { status: 'today', name: 'Hoy', colorClass: 'bg-blue-400' },
    { status: 'in_progress', name: 'En Proceso', colorClass: 'bg-brand-500' },
    { status: 'review', name: 'Revisión', colorClass: 'bg-purple-500' },
    { status: 'completed', name: 'Completado', colorClass: 'bg-emerald-500' }
  ];

  ngOnInit() {
    this.loadData();
  }

  async loadData() {
    this.isLoading = true;
    this.cdr.markForCheck();
    try {
      const [tasks, projects, profiles] = await Promise.all([
        this.supabase.getTasks(),
        this.supabase.getProjects(),
        this.supabase.getProfiles()
      ]);
      this.taskList = tasks;
      this.projectsList = projects;
      this.usersList = profiles;
    } catch (error) {
      console.error("Error loading tasks:", error);
    } finally {
      this.isLoading = false;
      this.cdr.markForCheck();
    }
  }

  getColumnTasks(status: string) {
    return this.taskList.filter(t => t.status === status);
  }

  getPriorityClass(priority: string) {
    switch (priority?.toLowerCase()) {
      case 'urgent': return 'bg-red-500 text-white';
      case 'high': return 'bg-red-50 text-red-700';
      case 'medium': return 'bg-amber-50 text-amber-700';
      case 'low': return 'bg-gray-100 text-gray-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  }

  openNewTaskPanel(status: string = 'pendiente') {
    this.isEditing = false;
    this.isPanelOpen = true;
    this.errorMessage = '';
    this.currentTask = {
      title: '',
      description: '',
      status: status,
      priority: 'medium',
      project_id: null,
      assigned_to: null,
      due_date: new Date().toISOString().split('T')[0]
    };
    this.cdr.markForCheck();
  }

  editTask(task: any) {
    this.isEditing = true;
    this.isPanelOpen = true;
    this.errorMessage = '';
    this.currentTask = { ...task };
    if (this.currentTask.due_date) {
      this.currentTask.due_date = new Date(this.currentTask.due_date).toISOString().split('T')[0];
    }
    this.cdr.markForCheck();
  }

  closePanel() {
    this.isPanelOpen = false;
    this.cdr.markForCheck();
  }

  async saveTask() {
    if (!this.currentTask.title?.trim()) {
      this.errorMessage = 'El título de la tarea es obligatorio.';
      return;
    }

    this.isSaving = true;
    this.errorMessage = '';
    this.cdr.markForCheck();

    try {
      const payload = {
        title: this.currentTask.title,
        description: this.currentTask.description,
        status: this.currentTask.status,
        priority: this.currentTask.priority,
        project_id: this.currentTask.project_id,
        assigned_to: this.currentTask.assigned_to,
        due_date: this.currentTask.due_date || null
      };

      if (this.isEditing) {
        await this.supabase.updateTask(this.currentTask.id, payload);
      } else {
        await this.supabase.createTask(payload);
      }

      this.closePanel();
      await this.loadData();
    } catch (error: any) {
      console.error("Error saving task:", error);
      this.errorMessage = error.message || 'Error al guardar la tarea.';
    } finally {
      this.isSaving = false;
      this.cdr.markForCheck();
    }
  }

  async deleteTask() {
    if (!confirm('¿Estás seguro de que deseas eliminar esta tarea?')) return;

    this.isSaving = true;
    this.cdr.markForCheck();

    try {
      await this.supabase.deleteTask(this.currentTask.id);
      this.closePanel();
      await this.loadData();
    } catch (error: any) {
      console.error("Error deleting task:", error);
      this.errorMessage = 'No se pudo eliminar la tarea.';
    } finally {
      this.isSaving = false;
      this.cdr.markForCheck();
    }
  }
}
