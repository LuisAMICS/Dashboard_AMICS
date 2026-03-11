import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { SupabaseService } from '../../core/services/supabase.service';
import { FormsModule } from '@angular/forms';
import { CurrencyPipe } from '@angular/common';

@Component({
  selector: 'app-clients',
  standalone: true,
  imports: [MatIconModule, FormsModule, CurrencyPipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="space-y-6 relative h-full flex flex-col overflow-hidden pb-4">
      <!-- Header -->
      <div class="flex items-center justify-between flex-shrink-0">
        <div>
          <h1 class="text-2xl font-display font-bold text-gray-900 tracking-tight">Directorio de Clientes</h1>
          <p class="text-sm text-gray-500 mt-1">Gestiona la información y estado de tus clientes activos.</p>
        </div>
        <div class="flex items-center gap-3">
          <button (click)="openNewClient()" class="flex items-center gap-2 bg-brand-600 hover:bg-brand-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors shadow-sm cursor-pointer">
            <mat-icon class="!w-4 !h-4 !text-[16px]">add</mat-icon>
            Nuevo Cliente
          </button>
          <button (click)="loadClients()" class="flex items-center gap-2 px-3 py-2 bg-white border border-gray-200 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors shadow-sm cursor-pointer">
            <mat-icon class="!w-4 !h-4 !text-[16px]">refresh</mat-icon>
          </button>
        </div>
      </div>

      <!-- Summary Cards -->
      <div class="grid grid-cols-1 md:grid-cols-3 gap-4 flex-shrink-0">
        <div class="bg-white p-5 rounded-xl border border-gray-200 shadow-sm flex items-center gap-4">
          <div class="p-3 bg-blue-50 text-blue-600 rounded-lg">
            <mat-icon>business</mat-icon>
          </div>
          <div>
            <p class="text-sm font-medium text-gray-500">Total Clientes</p>
            <p class="text-2xl font-bold text-gray-900">{{ metrics.total }}</p>
          </div>
        </div>
        <div class="bg-white p-5 rounded-xl border border-gray-200 shadow-sm flex items-center gap-4">
          <div class="p-3 bg-emerald-50 text-emerald-600 rounded-lg">
            <mat-icon>verified</mat-icon>
          </div>
          <div>
            <p class="text-sm font-medium text-gray-500">Activos</p>
            <p class="text-2xl font-bold text-gray-900">{{ metrics.active }}</p>
          </div>
        </div>
        <div class="bg-white p-5 rounded-xl border border-gray-200 shadow-sm flex items-center gap-4">
          <div class="p-3 bg-brand-50 text-brand-600 rounded-lg">
            <mat-icon>account_balance_wallet</mat-icon>
          </div>
          <div>
            <p class="text-sm font-medium text-gray-500">MRR Total</p>
            <p class="text-2xl font-bold text-gray-900">{{ metrics.mrr | currency:'EUR':'symbol':'1.0-2' }}</p>
          </div>
        </div>
      </div>

      <!-- Table Section -->
      <div class="bg-white rounded-xl border border-gray-200 shadow-sm flex flex-col min-h-0 flex-1 relative overflow-hidden">
        <!-- Toolbar -->
        <div class="p-4 border-b border-gray-200 flex flex-shrink-0 items-center justify-between bg-gray-50/50">
          <div class="relative w-72">
            <mat-icon class="absolute left-3 top-1/2 -translate-y-1/2 !w-4 !h-4 !text-[16px] text-gray-400">search</mat-icon>
            <input type="text" placeholder="Buscar por nombre, CIF, email..." class="w-full pl-9 pr-4 py-2 bg-white border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 outline-none transition-all" />
          </div>
          <div class="flex items-center gap-2">
            <button class="px-3 py-2 bg-white border border-gray-200 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-50 flex items-center gap-2 transition-colors">
              <mat-icon class="!w-4 !h-4 !text-[16px]">filter_list</mat-icon> Sector
            </button>
            <button class="px-3 py-2 bg-white border border-gray-200 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-50 flex items-center gap-2 transition-colors">
              <mat-icon class="!w-4 !h-4 !text-[16px]">sort</mat-icon> Ordenar
            </button>
          </div>
        </div>

        <!-- Table -->
        <div class="flex-1 overflow-auto bg-white">
          <table class="w-full text-left border-collapse min-w-[800px]">
            <thead class="sticky top-0 z-10 bg-gray-50/95 backdrop-blur-sm border-b border-gray-200">
              <tr class="text-xs uppercase tracking-wider text-gray-500 font-semibold">
                <th class="px-6 py-4 border-b border-gray-200">Cliente</th>
                <th class="px-6 py-4 border-b border-gray-200">Contacto Principal</th>
                <th class="px-6 py-4 border-b border-gray-200">Sector</th>
                <th class="px-6 py-4 border-b border-gray-200">Estado</th>
                <th class="px-6 py-4 border-b border-gray-200">Servicio</th>
                <th class="px-6 py-4 border-b border-gray-200 text-right">Valor</th>
                <th class="px-6 py-4 border-b border-gray-200"></th>
              </tr>
            </thead>
            <tbody class="divide-y divide-gray-100">
              @for (client of clients; track client.id) {
                <tr (click)="openEditClient(client)" class="hover:bg-gray-50/50 transition-colors group cursor-pointer">
                  <td class="px-6 py-4">
                    <div class="flex items-center gap-3">
                      <div class="w-10 h-10 rounded-lg bg-gray-100 border border-gray-200 flex items-center justify-center text-gray-600 font-bold font-display uppercase">
                        {{ client.company_name ? client.company_name.charAt(0) : '?' }}
                      </div>
                      <div>
                        <p class="text-sm font-medium text-gray-900">{{ client.company_name }}</p>
                        <p class="text-xs text-gray-500">{{ client.location || '-' }}</p>
                      </div>
                    </div>
                  </td>
                  <td class="px-6 py-4">
                    <p class="text-sm text-gray-900">{{ client.contact_person || 'Sin contacto' }}</p>
                    <p class="text-xs text-gray-500">{{ client.email || '-' }}</p>
                  </td>
                  <td class="px-6 py-4">
                    <span class="text-sm text-gray-600">{{ client.sector || '-' }}</span>
                  </td>
                  <td class="px-6 py-4">
                    <span class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium" 
                          [class]="client.status === 'active' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-gray-100 text-gray-700 border border-gray-200'">
                      <span class="w-1.5 h-1.5 rounded-full" [class]="client.status === 'active' ? 'bg-emerald-500' : 'bg-gray-400'"></span>
                      {{ client.status === 'active' ? 'Activo' : 'Inactivo' }}
                    </span>
                  </td>
                  <td class="px-6 py-4">
                    <span class="text-sm text-gray-600">{{ client.service || '-' }}</span>
                  </td>
                  <td class="px-6 py-4 text-right">
                    <p class="text-sm font-medium text-gray-900">{{ client.estimated_value | currency:'EUR':'symbol':'1.0-0' }}</p>
                    <p class="text-xs text-gray-500">/mes</p>
                  </td>
                  <td class="px-6 py-4 text-right">
                    <button type="button" class="text-gray-400 hover:text-brand-600 opacity-0 group-hover:opacity-100 transition-all">
                      <mat-icon class="!w-5 !h-5 !text-[20px]">chevron_right</mat-icon>
                    </button>
                  </td>
                </tr>
              }
            </tbody>
          </table>
        </div>
        
        <!-- Pagination -->
        <div class="p-4 border-t border-gray-200 flex-shrink-0 flex items-center justify-between text-sm text-gray-500 bg-gray-50/50">
          <span>Mostrando {{ clients.length > 0 ? 1 : 0 }} a {{ clients.length }} de {{ clients.length }} clientes</span>
          <div class="flex gap-1">
            <button type="button" class="px-3 py-1 border border-gray-200 rounded-md bg-white hover:bg-gray-50 disabled:opacity-50" disabled>Anterior</button>
            <button type="button" class="px-3 py-1 border border-gray-200 rounded-md bg-white hover:bg-gray-50 disabled:opacity-50" disabled>Siguiente</button>
          </div>
        </div>
      </div>

      <!-- OVERLAY PANEL -->
      @if (isPanelOpen) {
          <div class="fixed inset-0 bg-gray-900/40 z-40 transition-opacity backdrop-blur-sm" (click)="closePanel()"></div>
          
          <div class="fixed inset-y-0 right-0 z-50 w-full max-w-md bg-white border-l border-gray-200 shadow-2xl transform transition-transform overflow-y-auto flex flex-col">
              <!-- Panel Header -->
              <div class="px-6 py-5 border-b border-gray-100 flex items-center justify-between bg-gray-50/50 sticky top-0 z-10">
                  <div>
                      <h2 class="text-lg font-semibold text-gray-900">{{ isEditing ? 'Editar Cliente' : 'Nuevo Cliente' }}</h2>
                      <p class="text-xs text-gray-500 mt-0.5">{{ isEditing ? currentClient.company_name : 'Completa los datos del nuevo cliente' }}</p>
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
                      <label class="block text-sm font-medium text-gray-700 mb-1">Nombre de Empresa *</label>
                      <input type="text" [(ngModel)]="currentClient.company_name" class="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 outline-none transition-all" placeholder="Ej. Acme Corp" />
                  </div>
                  
                  <div>
                      <label class="block text-sm font-medium text-gray-700 mb-1">CIF / Tax ID</label>
                      <input type="text" [(ngModel)]="currentClient.tax_id" class="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 outline-none transition-all" placeholder="B12345678" />
                  </div>

                  <div>
                      <label class="block text-sm font-medium text-gray-700 mb-1">Ubicación</label>
                      <input type="text" [(ngModel)]="currentClient.location" class="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 outline-none transition-all" placeholder="Ej. Madrid, ES" />
                  </div>

                  <div class="grid grid-cols-2 gap-4">
                      <div>
                          <label class="block text-sm font-medium text-gray-700 mb-1">Contacto Principal</label>
                          <input type="text" [(ngModel)]="currentClient.contact_person" class="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 outline-none transition-all" placeholder="Ej. John Doe" />
                      </div>
                      <div>
                          <label class="block text-sm font-medium text-gray-700 mb-1">Sector</label>
                          <input type="text" [(ngModel)]="currentClient.sector" class="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 outline-none transition-all" placeholder="Ej. Tecnología" />
                      </div>
                  </div>

                  <div class="grid grid-cols-2 gap-4">
                      <div>
                          <label class="block text-sm font-medium text-gray-700 mb-1">Email principal</label>
                          <input type="email" [(ngModel)]="currentClient.email" class="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 outline-none transition-all" placeholder="contacto@empresa.com" />
                      </div>
                      <div>
                          <label class="block text-sm font-medium text-gray-700 mb-1">Teléfono</label>
                          <input type="tel" [(ngModel)]="currentClient.phone" class="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 outline-none transition-all" placeholder="+34 600..." />
                      </div>
                  </div>

                  <div class="grid grid-cols-2 gap-4 pt-2 border-t border-gray-100">
                      <div>
                          <label class="block text-sm font-medium text-gray-700 mb-1">Estado</label>
                          <select [(ngModel)]="currentClient.status" class="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 outline-none transition-all bg-white">
                              <option value="active">🟢 Activo</option>
                              <option value="inactive">⚪ Inactivo</option>
                          </select>
                      </div>
                      <div>
                          <label class="block text-sm font-medium text-gray-700 mb-1">Servicio Principal</label>
                          <input type="text" [(ngModel)]="currentClient.service" class="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 outline-none transition-all" placeholder="Ej. Consultoría" />
                      </div>
                  </div>

                  <div>
                      <label class="block text-sm font-medium text-gray-700 mb-1">Ingreso Mensual / MRR (€)</label>
                      <input type="number" [(ngModel)]="currentClient.estimated_value" class="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 outline-none transition-all" placeholder="5000" />
                  </div>
                  
                  @if(isEditing && currentClient.id) {
                      <div class="pt-4 mt-2">
                        <button type="button" (click)="deleteClient($event)" [disabled]="isLoading" class="text-sm text-red-600 hover:text-red-700 font-medium cursor-pointer flex items-center gap-1">
                            <mat-icon class="!w-4 !h-4 !text-[16px]">delete</mat-icon> Eliminar cliente
                        </button>
                      </div>
                  }
              </div>

              <!-- Panel Footer -->
              <div class="px-6 py-4 border-t border-gray-200 bg-gray-50 flex items-center justify-end gap-3 sticky bottom-0">
                  <button type="button" (click)="closePanel()" [disabled]="isLoading" class="px-4 py-2 bg-white border border-gray-200 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors shadow-sm cursor-pointer">
                      Cancelar
                  </button>
                  <button type="button" (click)="saveClient()" [disabled]="isLoading || !currentClient.company_name" class="px-4 py-2 bg-brand-600 border border-transparent text-white rounded-lg text-sm font-medium hover:bg-brand-700 transition-colors shadow-sm cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2">
                      @if(isLoading){
						  <mat-icon class="!w-4 !h-4 !text-[16px] animate-spin">sync</mat-icon>
                      }
                      {{ isEditing ? 'Guardar Cambios' : 'Crear Cliente' }}
                  </button>
              </div>
          </div>
      }
    </div>
  `
})
export class ClientsComponent implements OnInit {
  clients: any[] = [];
  metrics = {
    total: 0,
    active: 0,
    mrr: 0
  };

  // Panel state
  isPanelOpen = false;
  isEditing = false;
  isLoading = false;
  errorMessage = '';
  currentClient: any = {};

  constructor(
    private supabase: SupabaseService,
    private cdr: ChangeDetectorRef
  ) { }

  ngOnInit() {
    this.loadClients();
  }

  async loadClients() {
    try {
      this.clients = await this.supabase.getClients();
      this.calculateMetrics();
    } catch (error) {
      console.error("Error al cargar clientes:", error);
    } finally {
      this.cdr.markForCheck();
    }
  }

  calculateMetrics() {
    this.metrics.total = this.clients.length;
    this.metrics.active = this.clients.filter(c => c.status === 'active').length;
    this.metrics.mrr = this.clients.reduce((acc, c) => acc + (Number(c.estimated_value) || 0), 0);
  }

  openNewClient() {
    this.isEditing = false;
    this.currentClient = {
      company_name: '',
      tax_id: '',
      location: '',
      contact_person: '',
      email: '',
      phone: '',
      sector: '',
      status: 'active',
      service: '',
      estimated_value: 0
    };
    this.errorMessage = '';
    this.isPanelOpen = true;
    this.cdr.markForCheck();
  }

  openEditClient(client: any) {
    this.isEditing = true;
    // Deep clone to avoid immediate binding changes on table before save
    this.currentClient = JSON.parse(JSON.stringify(client));
    this.errorMessage = '';
    this.isPanelOpen = true;
    this.cdr.markForCheck();
  }

  closePanel() {
    this.isPanelOpen = false;
    this.cdr.markForCheck();
  }

  async saveClient() {
    if (!this.currentClient.company_name?.trim()) {
      this.errorMessage = 'El nombre del cliente es obligatorio.';
      return;
    }

    this.isLoading = true;
    this.errorMessage = '';
    this.cdr.markForCheck();

    try {
      const payload = {
        company_name: this.currentClient.company_name,
        tax_id: this.currentClient.tax_id,
        location: this.currentClient.location,
        contact_person: this.currentClient.contact_person,
        email: this.currentClient.email,
        phone: this.currentClient.phone,
        sector: this.currentClient.sector,
        status: this.currentClient.status,
        service: this.currentClient.service,
        estimated_value: this.currentClient.estimated_value
      };

      if (this.isEditing && this.currentClient.id) {
        await this.supabase.updateClient(this.currentClient.id, payload);
      } else {
        await this.supabase.createClient(payload);
      }

      this.closePanel();
      await this.loadClients();
    } catch (error: any) {
      console.error("Error guardando cliente:", error);
      this.errorMessage = error.message || 'Error al guardar.';
    } finally {
      this.isLoading = false;
      this.cdr.markForCheck();
    }
  }

  async deleteClient(event: Event) {
    event.stopPropagation();
    event.preventDefault();

    if (!confirm('¿Estás seguro de que deseas eliminar permanentemente a este Cliente? Esta acción no se puede deshacer.')) return;

    this.isLoading = true;
    this.cdr.markForCheck();

    try {
      await this.supabase.deleteClient(this.currentClient.id);
      this.closePanel();
      await this.loadClients();
    } catch (error) {
      console.error("Error eliminando cliente:", error);
      this.errorMessage = 'Hubo un error al eliminar el cliente.';
    } finally {
      this.isLoading = false;
      this.cdr.markForCheck();
    }
  }
}
