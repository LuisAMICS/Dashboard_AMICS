import { ChangeDetectionStrategy, ChangeDetectorRef, Component, inject, OnInit } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SupabaseService } from '../../core/services/supabase.service';

@Component({
  selector: 'app-settings',
  standalone: true,
  imports: [MatIconModule, CommonModule, FormsModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="max-w-5xl mx-auto space-y-6 pb-12">
      <!-- Loading Overlay -->
      @if (isLoading) {
        <div class="fixed inset-0 bg-white/60 backdrop-blur-[2px] z-50 flex items-center justify-center">
            <div class="flex flex-col items-center">
                <div class="w-12 h-12 border-4 border-brand-200 border-t-brand-600 rounded-full animate-spin"></div>
                <p class="mt-4 text-sm font-bold text-gray-600">Guardando cambios...</p>
            </div>
        </div>
      }

      <!-- Header -->
      <div>
        <h1 class="text-2xl font-display font-bold text-gray-900 tracking-tight">Ajustes del Workspace</h1>
        <p class="text-sm text-gray-500 mt-1">Configura preferencias, integraciones y permisos del equipo.</p>
      </div>

      <!-- Success Notification -->
      @if (showSuccess) {
        <div class="fixed top-24 right-8 bg-emerald-500 text-white px-6 py-4 rounded-2xl shadow-2xl z-[60] flex items-center gap-3 animate-in slide-in-from-right fade-in">
            <mat-icon>check_circle</mat-icon>
            <span class="font-bold">¡Cambios guardados con éxito!</span>
        </div>
      }

      <div class="flex flex-col md:flex-row gap-8">
        <!-- Sidebar Navigation -->
        <div class="w-full md:w-64 flex-shrink-0">
          <nav class="space-y-1">
            <button (click)="currentTab = 'profile'" [class]="currentTab === 'profile' ? 'w-full flex items-center gap-3 px-3 py-2.5 bg-brand-50 text-brand-700 rounded-xl text-sm font-bold transition-all shadow-sm shadow-brand-500/10' : 'w-full flex items-center gap-3 px-3 py-2.5 text-gray-600 hover:bg-gray-100/70 rounded-xl text-sm font-bold transition-all'">
              <mat-icon class="!w-5 !h-5 !text-[20px]">person</mat-icon> Perfil de Usuario
            </button>
            <button class="w-full flex items-center gap-3 px-3 py-2.5 text-gray-400 cursor-not-allowed rounded-xl text-sm font-bold transition-all">
              <mat-icon class="!w-5 !h-5 !text-[20px]">business</mat-icon> Detalles de Empresa
            </button>
            <button (click)="currentTab = 'team'" [class]="currentTab === 'team' ? 'w-full flex items-center gap-3 px-3 py-2.5 bg-brand-50 text-brand-700 rounded-xl text-sm font-bold transition-all shadow-sm shadow-brand-500/10' : 'w-full flex items-center gap-3 px-3 py-2.5 text-gray-600 hover:bg-gray-100/70 rounded-xl text-sm font-bold transition-all'">
              <mat-icon class="!w-5 !h-5 !text-[20px]">group</mat-icon> Equipo y Roles
            </button>
            <button class="w-full flex items-center gap-3 px-3 py-2.5 text-gray-400 cursor-not-allowed rounded-xl text-sm font-bold transition-all">
              <mat-icon class="!w-5 !h-5 !text-[20px]">view_kanban</mat-icon> Estados CRM
            </button>
            <button class="w-full flex items-center gap-3 px-3 py-2.5 text-gray-400 cursor-not-allowed rounded-xl text-sm font-bold transition-all">
              <mat-icon class="!w-5 !h-5 !text-[20px]">extension</mat-icon> Integraciones
            </button>
            <button class="w-full flex items-center gap-3 px-3 py-2.5 text-gray-400 cursor-not-allowed rounded-xl text-sm font-bold transition-all">
              <mat-icon class="!w-5 !h-5 !text-[20px]">notifications</mat-icon> Notificaciones
            </button>
          </nav>
        </div>

        <!-- Main Content Area -->
          <div class="flex-1 space-y-6">
          
          @if (currentTab === 'profile') {
            <!-- Profile Section -->
            <div class="bg-white rounded-3xl border border-gray-200 shadow-xl shadow-gray-200/40 overflow-hidden">
              <div class="p-8 border-b border-gray-100 bg-gray-50/30">
                <h2 class="text-lg font-bold text-gray-900">Perfil de Usuario</h2>
                <p class="text-sm text-gray-500 mt-1 font-medium">Actualiza tu información personal y foto de perfil.</p>
              </div>
              
              <div class="p-8 space-y-8">
                <!-- Avatar Upload -->
                <div class="flex flex-col sm:flex-row items-center gap-8">
                  <div class="relative group">
                      <img 
                          [src]="profile?.avatar_url || 'https://i.pravatar.cc/150?u=admin'" 
                          class="w-24 h-24 rounded-3xl object-cover border-4 border-white shadow-xl group-hover:brightness-90 transition-all" 
                          alt="Profile" 
                          referrerpolicy="no-referrer" />
                      <div class="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                          <mat-icon class="text-white">camera_alt</mat-icon>
                      </div>
                  </div>
                  <div class="text-center sm:text-left">
                    <label class="px-5 py-2.5 bg-brand-600 hover:bg-brand-700 text-white rounded-xl text-sm font-bold transition-all shadow-lg shadow-brand-500/20 cursor-pointer block mb-3 active:scale-95">
                      Cambiar Avatar
                      <input type="file" class="hidden" (change)="onAvatarSelected($event)" accept="image/*" />
                    </label>
                    <p class="text-xs text-gray-400 font-bold uppercase tracking-widest">JPG, GIF o PNG. < 2MB</p>
                  </div>
                </div>

                <!-- Form Fields -->
                <div class="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div class="space-y-2">
                    <label for="fullName" class="block text-xs font-black text-gray-400 uppercase tracking-widest">Nombre Completo</label>
                    <input 
                      id="fullName" 
                      type="text" 
                      [(ngModel)]="profile.full_name" 
                      class="w-full px-4 py-3 bg-white border border-gray-200 rounded-2xl text-sm font-bold focus:ring-4 focus:ring-brand-500/10 focus:border-brand-500 outline-none transition-all shadow-sm" />
                  </div>
                  
                  <div class="space-y-2">
                    <label for="email" class="block text-xs font-black text-gray-400 uppercase tracking-widest">Email (No editable)</label>
                    <input 
                      id="email" 
                      type="email" 
                      [value]="profile.email || 'auto@hazlotooeasy.com'" 
                      class="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-2xl text-sm font-bold text-gray-400 outline-none cursor-not-allowed" 
                      disabled />
                  </div>
                  
                  <div class="space-y-2">
                    <label for="role" class="block text-xs font-black text-gray-400 uppercase tracking-widest">Cargo / Puesto</label>
                    <input 
                      id="role" 
                      type="text" 
                      [(ngModel)]="profile.role" 
                      class="w-full px-4 py-3 bg-white border border-gray-200 rounded-2xl text-sm font-bold focus:ring-4 focus:ring-brand-500/10 focus:border-brand-500 outline-none transition-all shadow-sm" />
                  </div>
                  
                  <div class="space-y-2">
                    <label for="timezone" class="block text-xs font-black text-gray-400 uppercase tracking-widest">Zona Horaria</label>
                    <select 
                      id="timezone" 
                      [(ngModel)]="profile.timezone"
                      class="w-full px-4 py-3 bg-white border border-gray-200 rounded-2xl text-sm font-bold focus:ring-4 focus:ring-brand-500/10 focus:border-brand-500 outline-none transition-all shadow-sm">
                      <option value="Europe/Madrid">Madrid (GMT+1)</option>
                      <option value="Atlantic/Canary">Canarias (GMT+0)</option>
                      <option value="America/Bogota">Bogotá (GMT-5)</option>
                      <option value="America/Mexico_City">México (GMT-6)</option>
                    </select>
                  </div>
                </div>
              </div>
              
              <div class="p-6 bg-gray-50/50 border-t border-gray-100 flex justify-end">
                <button 
                  (click)="saveChanges()"
                  class="px-8 py-3 bg-brand-600 hover:bg-brand-700 text-white rounded-2xl text-sm font-black uppercase tracking-widest transition-all shadow-lg shadow-brand-500/20 active:scale-95">
                  Guardar Cambios
                </button>
              </div>
            </div>

            <!-- Quick Integrations Info -->
            <div class="bg-white rounded-3xl border border-gray-200 shadow-xl shadow-gray-200/40 overflow-hidden">
              <div class="p-8 border-b border-gray-100 bg-gray-50/30">
                <h2 class="text-lg font-bold text-gray-900">Integraciones de Sistema</h2>
              </div>
              <div class="p-0">
                <ul class="divide-y divide-gray-100">
                  <li class="p-8 flex items-center justify-between group">
                    <div class="flex items-center gap-5">
                      <div class="w-14 h-14 bg-gray-50 border border-gray-100 rounded-2xl flex items-center justify-center transition-transform group-hover:scale-110">
                        <img src="https://upload.wikimedia.org/wikipedia/commons/1/12/Google_Drive_icon_%282020%29.svg" alt="Drive" class="w-7 h-7" />
                      </div>
                      <div>
                        <p class="text-sm font-bold text-gray-900">Google Drive</p>
                        <p class="text-[11px] font-bold text-emerald-600 uppercase tracking-widest flex items-center gap-1.5">
                          <span class="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                          Sincronización Activa
                        </p>
                      </div>
                    </div>
                    <mat-icon class="text-gray-300 group-hover:text-brand-500 transition-colors">check_circle</mat-icon>
                  </li>
                  <li class="p-8 flex items-center justify-between group">
                    <div class="flex items-center gap-5">
                      <div class="w-14 h-14 bg-gray-50 border border-gray-100 rounded-2xl flex items-center justify-center transition-transform group-hover:scale-110">
                        <img src="https://upload.wikimedia.org/wikipedia/commons/d/d5/Slack_icon_2019.svg" alt="Slack" class="w-7 h-7" />
                      </div>
                      <div>
                        <p class="text-sm font-bold text-gray-900">Slack Notifications</p>
                        <p class="text-[11px] font-bold text-gray-400 uppercase tracking-widest">Pendiente de Configurar</p>
                      </div>
                    </div>
                    <button class="px-4 py-2 border border-gray-200 text-gray-600 rounded-xl text-xs font-black uppercase tracking-widest hover:bg-gray-50 transition-all">
                      Conectar
                    </button>
                  </li>
                </ul>
              </div>
            </div>
          } @else if (currentTab === 'team') {
            <!-- Team Section -->
            <div class="bg-white rounded-3xl border border-gray-200 shadow-xl shadow-gray-200/40 overflow-hidden">
              <div class="p-8 border-b border-gray-100 bg-gray-50/30 flex justify-between items-center">
                <div>
                    <h2 class="text-lg font-bold text-gray-900">Equipo y Roles</h2>
                    <p class="text-sm text-gray-500 mt-1 font-medium">Gestiona tu equipo de trabajo actual.</p>
                </div>
                <button (click)="openUserModal()" class="px-5 py-2.5 bg-brand-600 hover:bg-brand-700 text-white rounded-xl text-sm font-bold transition-all shadow-lg shadow-brand-500/20 flex items-center gap-2">
                    <mat-icon class="!w-5 !h-5 !text-[20px]">person_add</mat-icon> Iniciar Invitación
                </button>
              </div>

              <div class="p-0">
                  <table class="w-full text-left border-collapse">
                      <thead>
                        <tr class="bg-gray-50/50 border-b border-gray-100 text-[10px] uppercase font-bold text-gray-400 tracking-wider">
                          <th class="px-8 py-4">Miembro</th>
                          <th class="px-8 py-4">Rol en el Workspace</th>
                          <th class="px-8 py-4 text-right">Acciones</th>
                        </tr>
                      </thead>
                      <tbody class="divide-y divide-gray-50">
                        @for (member of teamList; track member.id) {
                            <tr class="hover:bg-brand-50/20 transition-colors group">
                                <td class="px-8 py-4">
                                    <div class="flex items-center gap-4">
                                        <img 
                                            [src]="member.avatar_url || 'https://i.pravatar.cc/150?u=' + member.id" 
                                            class="w-10 h-10 rounded-full border-2 border-white shadow-sm"
                                            referrerpolicy="no-referrer" />
                                        <div>
                                            <p class="text-sm font-bold text-gray-900">{{ member.full_name }}</p>
                                            <p class="text-[11px] text-gray-400 font-bold uppercase tracking-widest">{{ member.role || 'Miembro' }}</p>
                                        </div>
                                    </div>
                                </td>
                                <td class="px-8 py-4">
                                    <span class="inline-flex items-center px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest border"
                                        [class.bg-brand-50]="member.role?.toLowerCase() === 'admin' || member.role?.toLowerCase() === 'ceo & founder'"
                                        [class.text-brand-600]="member.role?.toLowerCase() === 'admin' || member.role?.toLowerCase() === 'ceo & founder'"
                                        [class.border-brand-100]="member.role?.toLowerCase() === 'admin' || member.role?.toLowerCase() === 'ceo & founder'"
                                        [class.bg-gray-50]="member.role?.toLowerCase() !== 'admin' && member.role?.toLowerCase() !== 'ceo & founder'"
                                        [class.text-gray-600]="member.role?.toLowerCase() !== 'admin' && member.role?.toLowerCase() !== 'ceo & founder'"
                                        [class.border-gray-200]="member.role?.toLowerCase() !== 'admin' && member.role?.toLowerCase() !== 'ceo & founder'">
                                        {{ member.role || 'Miembro' }}
                                    </span>
                                </td>
                                <td class="px-8 py-4 text-right">
                                    <div class="flex items-center justify-end gap-2">
                                        <button class="p-2 text-gray-400 hover:text-brand-600 hover:bg-brand-50 rounded-xl transition-all" title="Editar Permisos">
                                            <mat-icon class="!w-5 !h-5 !text-[20px]">edit</mat-icon>
                                        </button>
                                        <button (click)="removeUser(member)" class="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all" title="Eliminar Usuario">
                                            <mat-icon class="!w-5 !h-5 !text-[20px]">delete_outline</mat-icon>
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        }
                      </tbody>
                  </table>
              </div>
            </div>

            <!-- Modal Añadir Usuario -->
            @if(showUserModal) {
              <div class="fixed inset-0 bg-gray-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                <div class="bg-white rounded-[2rem] w-full max-w-lg shadow-2xl animate-in zoom-in-95 duration-200 overflow-hidden">
                    <div class="px-8 py-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                        <div>
                            <h2 class="text-xl font-bold text-gray-900">Invitar al Equipo</h2>
                            <p class="text-sm text-gray-500 mt-1 font-medium">Añade un nuevo colaborador al workspace.</p>
                        </div>
                        <button (click)="closeUserModal()" class="text-gray-400 hover:text-gray-600 hover:bg-white p-2 rounded-full transition-colors shadow-sm">
                            <mat-icon>close</mat-icon>
                        </button>
                    </div>

                    <div class="p-8 space-y-6">
                        <div class="space-y-2">
                            <label class="block text-xs font-black text-gray-400 uppercase tracking-widest">Nombre Completo</label>
                            <input type="text" [(ngModel)]="newUser.full_name" placeholder="Ej: Maria Lopez" class="w-full px-4 py-3 bg-white border border-gray-200 rounded-2xl text-sm font-bold focus:ring-4 focus:ring-brand-500/10 focus:border-brand-500 outline-none transition-all" />
                        </div>
                        
                        <div class="space-y-2">
                            <label class="block text-xs font-black text-gray-400 uppercase tracking-widest">Email</label>
                            <input type="email" [(ngModel)]="newUser.email" placeholder="maria@ejemplo.com" class="w-full px-4 py-3 bg-white border border-gray-200 rounded-2xl text-sm font-bold focus:ring-4 focus:ring-brand-500/10 focus:border-brand-500 outline-none transition-all" />
                        </div>

                        <div class="space-y-2">
                            <label class="block text-xs font-black text-gray-400 uppercase tracking-widest">Contraseña Temporal</label>
                            <input type="text" [(ngModel)]="newUser.password" placeholder="Mínimo 6 caracteres" class="w-full px-4 py-3 bg-white border border-gray-200 rounded-2xl text-sm font-bold focus:ring-4 focus:ring-brand-500/10 focus:border-brand-500 outline-none transition-all" />
                        </div>
                        
                        <div class="space-y-2">
                            <label class="block text-xs font-black text-gray-400 uppercase tracking-widest">Rol Asignado</label>
                            <select [(ngModel)]="newUser.role" class="w-full px-4 py-3 bg-white border border-gray-200 rounded-2xl text-sm font-bold focus:ring-4 focus:ring-brand-500/10 focus:border-brand-500 outline-none transition-all">
                                <option value="Miembro">Miembro (Por defecto)</option>
                                <option value="Admin">Administrador</option>
                            </select>
                        </div>
                    </div>

                    <div class="px-8 py-6 bg-gray-50/80 border-t border-gray-100 flex justify-end gap-3">
                        <button (click)="closeUserModal()" class="px-6 py-2.5 text-gray-600 hover:bg-white rounded-xl text-sm font-bold transition-all shadow-sm">Cancelar</button>
                        <button (click)="inviteUser()" class="px-6 py-2.5 bg-brand-600 hover:bg-brand-700 text-white rounded-xl text-sm font-bold uppercase tracking-widest transition-all shadow-lg shadow-brand-500/25 active:scale-95 flex items-center gap-2">
                            Enviar Invitación <mat-icon class="!w-4 !h-4 !text-[16px]">send</mat-icon>
                        </button>
                    </div>
                </div>
              </div>
            }
          }

        </div>
      </div>
    </div>
  `
})
export class SettingsComponent implements OnInit {
  private supabase = inject(SupabaseService);
  private cdr = inject(ChangeDetectorRef);

  profile: any = {
    full_name: '',
    role: '',
    timezone: 'Europe/Madrid',
    avatar_url: ''
  };

  isLoading = false;
  showSuccess = false;

  currentTab = 'profile';
  teamList: any[] = [];
  
  showUserModal = false;
  newUser = {
      full_name: '',
      email: '',
      password: '',
      role: 'Miembro'
  };

  ngOnInit() {
    this.loadData();
  }

  async loadData() {
    try {
      const [profileData, teamData] = await Promise.all([
         this.supabase.getMyProfile(),
         this.supabase.getProfiles()
      ]);

      if (profileData) {
        this.profile = { ...profileData };
      } else {
        // Fallback for demo if single() fails
        this.profile = {
          id: '11111111-1111-1111-1111-111111111111',
          full_name: 'Alex Rivera',
          role: 'CEO & Founder',
          timezone: 'Europe/Madrid',
          avatar_url: null
        };
      }
      this.teamList = teamData || [];
      this.cdr.markForCheck();
    } catch (error) {
      console.error('Error loading settings data:', error);
    }
  }

  async onAvatarSelected(event: any) {
    const file = event.target.files[0];
    if (!file) return;

    this.isLoading = true;
    this.cdr.markForCheck();

    try {
      const publicUrl = await this.supabase.uploadAvatar(file, this.profile.id);
      this.profile.avatar_url = publicUrl;
      // Also update the profile in DB immediately for the avatar
      await this.supabase.updateProfile(this.profile.id, { avatar_url: publicUrl });
    } catch (error) {
      console.error('Avatar upload error:', error);
      alert('Error al subir la imagen.');
    } finally {
      this.isLoading = false;
      this.cdr.markForCheck();
    }
  }

  async saveChanges() {
    this.isLoading = true;
    this.cdr.markForCheck();

    try {
      // Remove metadata before saving
      const { id, updated_at, ...updates } = this.profile;
      await this.supabase.updateProfile(this.profile.id, updates);

      this.showSuccess = true;
      this.cdr.markForCheck();

      setTimeout(() => {
        this.showSuccess = false;
        this.cdr.markForCheck();
      }, 3000);

    } catch (error) {
      console.error('Save profile error:', error);
      alert('Error al guardar los cambios. Verifica la base de datos.');
    } finally {
      this.isLoading = false;
      this.cdr.markForCheck();
    }
  }
  
  openUserModal() {
      this.newUser = { full_name: '', email: '', password: '', role: 'Miembro' };
      this.showUserModal = true;
      this.cdr.markForCheck();
  }
  
  closeUserModal() {
      this.showUserModal = false;
      this.cdr.markForCheck();
  }
  
  async inviteUser() {
      if (!this.newUser.full_name || !this.newUser.email || !this.newUser.password) {
          alert('Por favor, completa nombre, email y contraseña.');
          return;
      }
      
      this.isLoading = true;
      this.cdr.markForCheck();
      
      try {
          await this.supabase.createUser({
              email: this.newUser.email,
              password: this.newUser.password,
              full_name: this.newUser.full_name,
              role: this.newUser.role
          });
          
          this.closeUserModal();
          this.showSuccess = true;
          await this.loadData();
          setTimeout(() => { this.showSuccess = false; this.cdr.markForCheck(); }, 3000);
      } catch (err) {
          console.error(err);
          alert('Hubo un error al invitar al usuario. Asegúrate de tener permisos de Admin o CEO.');
      } finally {
          this.isLoading = false;
          this.cdr.markForCheck();
      }
  }
  
  async removeUser(member: any) {
       // Protect yourself from being deleted
       if (member.id === this.profile.id) {
           alert("No puedes eliminarte a ti mismo.");
           return;
       }
       if (confirm(`¿Estás seguro de que deseas eliminar permanentemente a ${member.full_name}?`)) {
           this.isLoading = true;
           this.cdr.markForCheck();
           try {
               await this.supabase.deleteUser(member.id);
               this.showSuccess = true;
               await this.loadData();
               setTimeout(() => { this.showSuccess = false; this.cdr.markForCheck(); }, 3000);
           } catch(err) {
               console.error(err);
               alert('Error al eliminar el usuario. Comprueba tus permisos.');
           } finally {
               this.isLoading = false;
               this.cdr.markForCheck();
           }
       }
  }
}
