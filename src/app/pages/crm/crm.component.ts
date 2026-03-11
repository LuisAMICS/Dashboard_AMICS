import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { SupabaseService } from '../../core/services/supabase.service';
import { FormsModule } from '@angular/forms';
import { CurrencyPipe } from '@angular/common';

@Component({
  selector: 'app-crm',
  standalone: true,
  imports: [MatIconModule, FormsModule, CurrencyPipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="h-full flex flex-col relative w-full overflow-hidden">
      <!-- Header -->
      <div class="flex items-center justify-between mb-6 flex-shrink-0 px-1">
        <div>
          <h1 class="text-2xl font-display font-bold text-gray-900 tracking-tight">CRM Pipeline</h1>
          <p class="text-sm text-gray-500 mt-1">Gestiona tus leads y oportunidades comerciales.</p>
        </div>
        <div class="flex items-center gap-3">
          <div class="flex bg-gray-100 p-1 rounded-lg">
            <button class="px-3 py-1.5 bg-white shadow-sm rounded-md text-sm font-medium text-gray-900 flex items-center gap-2">
              <mat-icon class="!w-4 !h-4 !text-[16px]">view_kanban</mat-icon> Kanban
            </button>
            <button class="px-3 py-1.5 text-gray-600 hover:text-gray-900 rounded-md text-sm font-medium flex items-center gap-2 transition-colors">
              <mat-icon class="!w-4 !h-4 !text-[16px]">table_rows</mat-icon> Lista
            </button>
          </div>
          <button (click)="openNewLead()" class="flex items-center gap-2 bg-brand-600 hover:bg-brand-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors shadow-sm cursor-pointer">
            <mat-icon class="!w-4 !h-4 !text-[16px]">add</mat-icon>
            Nuevo Lead
          </button>
          <button (click)="loadLeads()" class="flex items-center gap-2 px-3 py-2 bg-white border border-gray-200 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors shadow-sm cursor-pointer">
            <mat-icon class="!w-4 !h-4 !text-[16px]">refresh</mat-icon>
          </button>
        </div>
      </div>

      <!-- Filters -->
      <div class="flex items-center gap-4 mb-6 flex-shrink-0 px-1">
        <div class="relative flex-1 max-w-xs">
          <mat-icon class="absolute left-3 top-1/2 -translate-y-1/2 !w-4 !h-4 !text-[16px] text-gray-400">search</mat-icon>
          <input type="text" placeholder="Buscar leads..." class="w-full pl-9 pr-4 py-2 bg-white border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 outline-none transition-all" />
        </div>
      </div>

      <!-- Kanban Board -->
      <div class="flex-1 overflow-x-auto overflow-y-hidden pb-4 px-1">
        <div class="flex gap-6 h-full min-w-max">
          @for (stage of stages; track stage.id) {
            <div class="w-80 flex flex-col h-full bg-gray-100/50 rounded-xl border border-gray-200/60">
              <!-- Stage Header -->
              <div class="p-4 flex items-center justify-between border-b border-gray-200/60 flex-shrink-0">
                <div class="flex items-center gap-2">
                  <span class="w-2.5 h-2.5 rounded-full" [class]="stage.colorClass"></span>
                  <h3 class="font-semibold text-gray-900">{{ stage.name }}</h3>
                  <span class="bg-gray-200 text-gray-600 text-xs font-medium px-2 py-0.5 rounded-full">{{ stage.leads.length }}</span>
                </div>
              </div>
              
              <!-- Stage Value -->
              <div class="px-4 py-2 text-xs font-medium text-gray-500 border-b border-gray-200/60 flex-shrink-0">
                Valor total: {{ stage.totalValue | currency:'EUR':'symbol':'1.0-0' }}
              </div>

              <!-- Leads List -->
              <div class="flex-1 overflow-y-auto p-3 space-y-3">
                @for (lead of stage.leads; track lead.id) {
                  <div (click)="openEditLead(lead)" class="bg-white p-4 rounded-lg border border-gray-200 shadow-sm hover:shadow-md hover:border-brand-300 transition-all cursor-pointer group">
                    <div class="flex justify-between items-start mb-2">
                      <h4 class="font-medium text-gray-900 group-hover:text-brand-600 transition-colors">{{ lead.company_name }}</h4>
                      <mat-icon class="!w-4 !h-4 !text-[16px] text-gray-300 opacity-0 group-hover:opacity-100 transition-opacity">edit</mat-icon>
                    </div>
                    <p class="text-xs text-gray-500 mb-3">{{ lead.contact_person || 'Sin contacto' }} • {{ lead.role || '-' }}</p>
                    
                    <div class="flex items-center justify-between mt-4">
                      <span class="text-sm font-semibold text-gray-900">{{ lead.estimated_value | currency:'EUR':'symbol':'1.0-0' }}</span>
                      <div class="flex items-center gap-2">
                        @if (lead.priority === 'urgent' || lead.priority === 'high') {
                          <mat-icon class="!w-4 !h-4 !text-[16px] text-red-500" title="Prioridad Alta">local_fire_department</mat-icon>
                        }
                        @if (lead.profiles?.avatar_url) {
                            <img [src]="lead.profiles.avatar_url" class="w-6 h-6 rounded-full border border-gray-200" [title]="lead.profiles?.full_name" alt="Owner Avatar" referrerpolicy="no-referrer" />
                        } @else {
                            <div class="w-6 h-6 rounded-full bg-gray-200 flex items-center justify-center text-[10px] text-gray-600 font-medium">
                                {{ lead.profiles?.full_name ? lead.profiles.full_name.charAt(0) : '?' }}
                            </div>
                        }
                      </div>
                    </div>
                  </div>
                }
              </div>
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
                      <h2 class="text-lg font-semibold text-gray-900">{{ isEditing ? 'Editar Lead' : 'Nuevo Lead' }}</h2>
                      <p class="text-xs text-gray-500 mt-0.5">{{ isEditing ? currentLead.company_name : 'Completa los datos de la nueva oportunidad' }}</p>
                  </div>
                  <button (click)="closePanel()" class="text-gray-400 hover:text-gray-600 transition-colors p-1 rounded-md hover:bg-gray-100 cursor-pointer">
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
                      <label class="block text-sm font-medium text-gray-700 mb-1">Nombre de Empresa *</label>
                      <input type="text" [(ngModel)]="currentLead.company_name" class="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 outline-none transition-all" placeholder="Ej. Acme Corp" />
                  </div>

                  <div class="grid grid-cols-2 gap-4">
                      <div>
                          <label class="block text-sm font-medium text-gray-700 mb-1">Contacto</label>
                          <input type="text" [(ngModel)]="currentLead.contact_person" class="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 outline-none transition-all" placeholder="Ej. John Doe" />
                      </div>
                      <div>
                          <label class="block text-sm font-medium text-gray-700 mb-1">Cargo</label>
                          <input type="text" [(ngModel)]="currentLead.role" class="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 outline-none transition-all" placeholder="Ej. CEO" />
                      </div>
                  </div>

                  <div class="grid grid-cols-2 gap-4">
                      <div>
                          <label class="block text-sm font-medium text-gray-700 mb-1">Email</label>
                          <input type="email" [(ngModel)]="currentLead.email" class="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 outline-none transition-all" placeholder="john@acme.com" />
                      </div>
                      <div>
                          <label class="block text-sm font-medium text-gray-700 mb-1">Teléfono</label>
                          <input type="tel" [(ngModel)]="currentLead.phone" class="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 outline-none transition-all" placeholder="+34 600..." />
                      </div>
                  </div>

                  <div class="grid grid-cols-2 gap-4 pt-2 border-t border-gray-100">
                      <div>
                          <label class="block text-sm font-medium text-gray-700 mb-1">Estado</label>
                          <select [(ngModel)]="currentLead.status" class="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 outline-none transition-all bg-white">
                              <option value="new">1. Nuevo Lead</option>
                              <option value="contacted">2. Contactado</option>
                              <option value="meeting">3. Reunión</option>
                              <option value="proposal">4. Propuesta</option>
                              <option value="negotiation">5. Negociación</option>
                              <option value="closed_won">✅ Cerrado (Ganado)</option>
                              <option value="closed_lost">❌ Cerrado (Perdido)</option>
                          </select>
                      </div>
                      <div>
                          <label class="block text-sm font-medium text-gray-700 mb-1">Prioridad</label>
                          <select [(ngModel)]="currentLead.priority" class="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 outline-none transition-all bg-white">
                              <option value="low">Baja</option>
                              <option value="medium">Media</option>
                              <option value="high">Alta</option>
                              <option value="urgent">Urgente</option>
                          </select>
                      </div>
                  </div>

                  <div>
                      <label class="block text-sm font-medium text-gray-700 mb-1">Valor Estimado (€)</label>
                      <input type="number" [(ngModel)]="currentLead.estimated_value" class="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 outline-none transition-all" placeholder="5000" />
                  </div>

                  <div>
                      <label class="block text-sm font-medium text-gray-700 mb-1">Notas internas</label>
                      <textarea [(ngModel)]="currentLead.notes" rows="3" class="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 outline-none transition-all resize-none" placeholder="Añade contexto sobre esta oportunidad..."></textarea>
                  </div>
                  
                  @if(isEditing && currentLead.id) {
                      <div class="pt-4 mt-2">
                        <button type="button" (click)="deleteLead($event)" [disabled]="isLoading" class="text-sm text-red-600 hover:text-red-700 font-medium cursor-pointer flex items-center gap-1">
                            <mat-icon class="!w-4 !h-4 !text-[16px]">delete</mat-icon> Eliminar lead
                        </button>
                      </div>
                  }
              </div>

              <!-- Panel Footer -->
              <div class="px-6 py-4 border-t border-gray-200 bg-gray-50 flex items-center justify-end gap-3 sticky bottom-0">
                  <button type="button" (click)="closePanel()" [disabled]="isLoading" class="px-4 py-2 bg-white border border-gray-200 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors shadow-sm cursor-pointer">
                      Cancelar
                  </button>
                  <button type="button" (click)="saveLead()" [disabled]="isLoading || !currentLead.company_name" class="px-4 py-2 bg-brand-600 border border-transparent text-white rounded-lg text-sm font-medium hover:bg-brand-700 transition-colors shadow-sm cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2">
                      @if(isLoading){
						  <mat-icon class="!w-4 !h-4 !text-[16px] animate-spin">sync</mat-icon>
                      }
                      {{ isEditing ? 'Guardar Cambios' : 'Crear Lead' }}
                  </button>
              </div>
          </div>
      }
    </div>
  `
})
export class CrmComponent implements OnInit {

  rawLeads: any[] = [];

  stagesDef = [
    { id: 'new', name: 'Nuevo Lead', colorClass: 'bg-blue-400' },
    { id: 'contacted', name: 'Contactado', colorClass: 'bg-amber-400' },
    { id: 'meeting', name: 'Reunión Agendada', colorClass: 'bg-purple-400' },
    { id: 'proposal', name: 'Propuesta Enviada', colorClass: 'bg-brand-400' },
    { id: 'negotiation', name: 'Negociación', colorClass: 'bg-emerald-400' },
    { id: 'closed_won', name: 'Ganados', colorClass: 'bg-green-500' }
  ];

  stages: any[] = [];

  // Form Panel State
  isPanelOpen = false;
  isEditing = false;
  isLoading = false;
  errorMessage = '';

  currentLead: any = {};

  constructor(
    private supabase: SupabaseService,
    private cdr: ChangeDetectorRef
  ) { }

  ngOnInit() {
    this.initStages();
    this.loadLeads();
  }

  initStages() {
    this.stages = this.stagesDef.map(def => ({
      ...def,
      leads: [],
      totalValue: 0
    }));
  }

  async loadLeads() {
    try {
      this.rawLeads = await this.supabase.getLeads();
      this.processLeadsToKanban();
    } catch (error) {
      console.error("Error al cargar leads:", error);
    } finally {
      this.cdr.markForCheck();
    }
  }

  processLeadsToKanban() {
    // Reiniciar
    this.initStages();

    for (const lead of this.rawLeads) {
      const stage = this.stages.find(s => s.id === lead.status);
      if (stage) {
        stage.leads.push(lead);
        stage.totalValue += Number(lead.estimated_value) || 0;
      }
    }
  }

  // --- Opciones Modal ---
  openNewLead() {
    this.isEditing = false;
    this.currentLead = {
      company_name: '',
      contact_person: '',
      role: '',
      email: '',
      phone: '',
      status: 'new',
      priority: 'medium',
      estimated_value: 0,
      notes: ''
    };
    this.errorMessage = '';
    this.isPanelOpen = true;
    this.cdr.markForCheck();
  }

  openEditLead(lead: any) {
    this.isEditing = true;
    // Clon profundo simple
    this.currentLead = JSON.parse(JSON.stringify(lead));
    this.errorMessage = '';
    this.isPanelOpen = true;
    this.cdr.markForCheck();
  }

  closePanel() {
    this.isPanelOpen = false;
    this.cdr.markForCheck();
  }

  async saveLead() {
    // Validación básica
    if (!this.currentLead.company_name?.trim()) {
      this.errorMessage = 'El nombre de la empresa es obligatorio.';
      return;
    }

    this.isLoading = true;
    this.errorMessage = '';
    this.cdr.markForCheck();

    try {
      // Preparamos el payload a enviar
      const payload = {
        company_name: this.currentLead.company_name,
        contact_person: this.currentLead.contact_person,
        role: this.currentLead.role,
        email: this.currentLead.email,
        phone: this.currentLead.phone,
        status: this.currentLead.status,
        priority: this.currentLead.priority,
        estimated_value: this.currentLead.estimated_value,
        notes: this.currentLead.notes
      };

      if (this.isEditing && this.currentLead.id) {
        // Update
        await this.supabase.updateLead(this.currentLead.id, payload);
      } else {
        // Insert
        // Como creamos para test, podemos simular que le asignamos a un usuario o dejarlo nulo si la DB lo permite
        await this.supabase.createLead(payload);
      }

      // Éxito, cerramos panel y recargamos
      this.closePanel();
      await this.loadLeads();
    } catch (error: any) {
      console.error("Error guardando lead:", error);
      this.errorMessage = error.message || 'Error al guardar. Verifica la conexión.';
    } finally {
      this.isLoading = false;
      this.cdr.markForCheck();
    }
  }

  async deleteLead(event: Event) {
    event.stopPropagation();
    event.preventDefault();

    if (!confirm('¿Estás seguro de que deseas eliminar permanentemente este Lead?')) return;

    this.isLoading = true;
    this.cdr.markForCheck();

    try {
      await this.supabase.deleteLead(this.currentLead.id);
      this.closePanel();
      await this.loadLeads();
    } catch (error) {
      console.error("Error eliminando:", error);
      this.errorMessage = 'Hubo un error al eliminar el lead.';
    } finally {
      this.isLoading = false;
      this.cdr.markForCheck();
    }
  }

}

