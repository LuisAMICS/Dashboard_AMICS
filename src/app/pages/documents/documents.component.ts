import { ChangeDetectionStrategy, ChangeDetectorRef, Component, inject, OnInit } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { CommonModule, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SupabaseService } from '../../core/services/supabase.service';

@Component({
  selector: 'app-documents',
  standalone: true,
  imports: [MatIconModule, CommonModule, FormsModule, DatePipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="space-y-6 relative h-full flex flex-col overflow-hidden">
      <!-- Loader Overlay -->
      @if (isLoading) {
        <div class="absolute inset-0 bg-white/60 backdrop-blur-[2px] z-50 flex items-center justify-center">
            <div class="flex flex-col items-center">
                <div class="w-12 h-12 border-4 border-brand-200 border-t-brand-600 rounded-full animate-spin"></div>
                <p class="mt-4 text-sm font-medium text-gray-600">Sincronizando con Google Drive...</p>
            </div>
        </div>
      }

      <!-- Header -->
      <div class="flex items-center justify-between flex-shrink-0 px-1">
        <div>
          <h1 class="text-2xl font-display font-bold text-gray-900 tracking-tight">Documentos</h1>
          <p class="text-sm text-gray-500 mt-1">Archivos sincronizados automáticamente con Google Drive.</p>
        </div>
        <div class="flex items-center gap-3">
          <a 
            href="https://drive.google.com/drive/folders/12H_cAX-oC12La_MjP07YkoaFGTHIN-8p" 
            target="_blank"
            class="px-4 py-2 bg-white border border-gray-200 text-gray-700 rounded-xl text-sm font-bold hover:bg-gray-50 flex items-center gap-2 transition-all shadow-sm active:scale-95">
            <img src="https://upload.wikimedia.org/wikipedia/commons/1/12/Google_Drive_icon_%282020%29.svg" alt="Drive" class="w-4 h-4" />
            Ver Carpeta en Drive
          </a>
          
          <label class="flex items-center gap-2 bg-brand-600 hover:bg-brand-700 text-white px-4 py-2 rounded-xl text-sm font-bold transition-all shadow-lg shadow-brand-500/20 cursor-pointer active:scale-95">
            <mat-icon class="!w-4 !h-4 !text-[16px]">upload_file</mat-icon>
            Subir Documento
            <input type="file" class="hidden" (change)="onFileSelected($event)" />
          </label>
        </div>
      </div>

      <div class="flex gap-6 flex-1 overflow-hidden pb-4">
        <!-- Sidebar Filters -->
        <div class="w-64 flex-shrink-0 space-y-6">
          <div>
            <h3 class="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4">Carpetas</h3>
            <ul class="space-y-1.5">
              <li>
                <button (click)="filterFolder('all')" class="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-bold transition-all" [class]="currentFolder === 'all' ? 'bg-brand-50 text-brand-700 shadow-sm shadow-brand-500/10' : 'text-gray-600 hover:bg-gray-100/70'">
                  <mat-icon class="!w-5 !h-5 !text-[20px]">folder</mat-icon> Todos los archivos
                </button>
              </li>
              <li>
                <button (click)="filterFolder('clients')" class="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-bold transition-all" [class]="currentFolder === 'clients' ? 'bg-brand-50 text-brand-700 shadow-sm shadow-brand-500/10' : 'text-gray-600 hover:bg-gray-100/70'">
                  <mat-icon class="!w-5 !h-5 !text-[20px]">business</mat-icon> Clientes
                </button>
              </li>
              <li>
                <button (click)="filterFolder('projects')" class="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-bold transition-all" [class]="currentFolder === 'projects' ? 'bg-brand-50 text-brand-700 shadow-sm shadow-brand-500/10' : 'text-gray-600 hover:bg-gray-100/70'">
                  <mat-icon class="!w-5 !h-5 !text-[20px]">assignment</mat-icon> Proyectos
                </button>
              </li>
            </ul>
          </div>

          <div class="pt-6 border-t border-gray-100">
            <h3 class="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4">Tipo de Archivo</h3>
            <ul class="space-y-3">
              @for(type of fileTypes; track type.id) {
                <li>
                  <label class="flex items-center gap-3 px-2 py-1 cursor-pointer group rounded-lg hover:bg-gray-50 transition-colors">
                    <input type="checkbox" [(ngModel)]="type.checked" (change)="applyFilters()" class="w-4 h-4 rounded border-gray-300 text-brand-600 focus:ring-brand-500" />
                    <span class="text-sm font-medium text-gray-600 group-hover:text-gray-900">{{ type.name }}</span>
                  </label>
                </li>
              }
            </ul>
          </div>

          <div class="p-4 bg-brand-50/50 rounded-2xl border border-brand-100 mt-auto">
             <div class="flex items-center gap-2 mb-2">
                <mat-icon class="text-brand-600 !w-4 !h-4 !text-[16px]">info</mat-icon>
                <span class="text-[10px] font-black text-brand-700 uppercase tracking-widest">Sincronización</span>
             </div>
             <p class="text-[11px] text-brand-800 leading-relaxed font-medium">
                Tus archivos se guardan en Supabase y en la carpeta común de **Google Drive** simultáneamente.
             </p>
          </div>
        </div>

        <!-- Main Content -->
        <div class="flex-1 bg-white rounded-2xl border border-gray-200/80 shadow-xl shadow-gray-200/40 overflow-hidden flex flex-col">
          <!-- Toolbar -->
          <div class="p-4 border-b border-gray-100 flex items-center justify-between bg-gray-50/30">
            <div class="relative w-80 group">
              <mat-icon class="absolute left-3 top-1/2 -translate-y-1/2 !w-4 !h-4 !text-[16px] text-gray-400 group-focus-within:text-brand-500 transition-colors">search</mat-icon>
              <input 
                type="text" 
                [(ngModel)]="searchQuery"
                (ngModelChange)="applyFilters()"
                placeholder="Buscar documentos..." 
                class="w-full pl-9 pr-4 py-2 bg-white border border-gray-200 rounded-xl text-sm font-bold focus:ring-4 focus:ring-brand-500/10 focus:border-brand-500 outline-none transition-all shadow-sm" />
            </div>
            <div class="flex items-center gap-2">
              <button (click)="viewMode = 'grid'" class="p-2 rounded-lg transition-all" [class]="viewMode === 'grid' ? 'text-brand-600 bg-brand-50 shadow-sm' : 'text-gray-400 hover:text-gray-600 hover:bg-gray-100'">
                <mat-icon class="!w-5 !h-5 !text-[20px]">grid_view</mat-icon>
              </button>
              <button (click)="viewMode = 'list'" class="p-2 rounded-lg transition-all" [class]="viewMode === 'list' ? 'text-brand-600 bg-brand-50 shadow-sm' : 'text-gray-400 hover:text-gray-600 hover:bg-gray-100'">
                <mat-icon class="!w-5 !h-5 !text-[20px]">table_rows</mat-icon>
              </button>
            </div>
          </div>

          <!-- Content Area -->
          <div class="flex-1 overflow-y-auto custom-scrollbar">
            @if (filteredDocuments.length === 0) {
                <div class="flex flex-col items-center justify-center py-24 text-gray-300">
                    <div class="w-16 h-16 rounded-2xl bg-gray-50 flex items-center justify-center mb-4">
                        <mat-icon class="!w-8 !h-8 !text-[32px]">folder_open</mat-icon>
                    </div>
                    <p class="text-sm font-bold text-gray-500">No se encontraron documentos</p>
                    <p class="text-xs mt-1">Sube archivos o ajusta los filtros.</p>
                </div>
            } @else if (viewMode === 'list') {
                <table class="w-full text-left border-collapse">
                  <thead>
                    <tr class="bg-gray-50/50 border-b border-gray-100 text-[10px] uppercase font-bold text-gray-400 tracking-wider">
                      <th class="px-6 py-4">Nombre</th>
                      <th class="px-6 py-4">Relacionado con</th>
                      <th class="px-6 py-4">Sincronización</th>
                      <th class="px-6 py-4 font-center">Responsable</th>
                      <th class="px-6 py-4">Fecha</th>
                      <th class="px-6 py-4 text-right pr-8">Acciones</th>
                    </tr>
                  </thead>
                  <tbody class="divide-y divide-gray-50">
                    @for (doc of filteredDocuments; track doc.id) {
                      <tr class="hover:bg-brand-50/20 transition-colors group">
                        <td class="px-6 py-4 min-w-[300px]">
                          <div class="flex items-center gap-3">
                            <div class="p-2.5 rounded-xl shadow-sm transition-transform group-hover:scale-110" [class]="getDocIcon(doc.mime_type).bg">
                              <mat-icon class="!w-5 !h-5 !text-[20px]" [class]="getDocIcon(doc.mime_type).color">
                                {{ getDocIcon(doc.mime_type).icon }}
                              </mat-icon>
                            </div>
                            <div>
                                <p class="text-sm font-bold text-gray-900 group-hover:text-brand-700 transition-colors truncate max-w-[200px]">{{ doc.name }}</p>
                                <p class="text-[10px] text-gray-400 font-bold uppercase tracking-tighter">{{ formatSize(doc.size) }} • {{ getDocType(doc.mime_type) }}</p>
                            </div>
                          </div>
                        </td>
                        <td class="px-6 py-4">
                            @if (doc.projects?.name) {
                                <span class="inline-flex items-center px-2 py-0.5 rounded-lg text-[10px] font-black bg-brand-50 text-brand-600 uppercase tracking-widest border border-brand-100">
                                    {{ doc.projects.name }}
                                </span>
                            } @else {
                                <span class="text-[11px] text-gray-400 italic font-medium">Archivador General</span>
                            }
                        </td>
                        <td class="px-6 py-4">
                            @if (doc.drive_file_id) {
                                <div class="flex items-center gap-2 text-emerald-600">
                                    <mat-icon class="!w-4 !h-4 !text-[16px]">cloud_done</mat-icon>
                                    <span class="text-[10px] font-black uppercase tracking-widest">En Drive</span>
                                </div>
                            } @else {
                                <div class="flex items-center gap-2 text-gray-400">
                                    <mat-icon class="!w-4 !h-4 !text-[16px]">cloud_off</mat-icon>
                                    <span class="text-[10px] font-black uppercase tracking-widest">Solo Local</span>
                                </div>
                            }
                        </td>
                        <td class="px-6 py-4">
                          <div class="flex items-center gap-2">
                             <img 
                                [src]="doc.profiles?.avatar_url || 'https://i.pravatar.cc/150?u=' + doc.id" 
                                class="w-6 h-6 rounded-full border border-white shadow-sm" 
                                referrerpolicy="no-referrer" />
                             <span class="text-[11px] font-bold text-gray-600">{{ doc.profiles?.full_name || 'Sistema' }}</span>
                          </div>
                        </td>
                        <td class="px-6 py-4 text-[11px] font-bold text-gray-500 uppercase">{{ doc.created_at | date:'dd MMM yyyy' }}</td>
                        <td class="px-6 py-4 text-right pr-6">
                          <div class="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-all duration-300">
                            @if (doc.drive_file_id) {
                                <a 
                                    [href]="'https://drive.google.com/file/d/' + doc.drive_file_id + '/view'" 
                                    target="_blank"
                                    class="p-2 text-gray-400 hover:text-brand-600 hover:bg-brand-50 rounded-xl transition-all" 
                                    title="Abrir en Drive">
                                    <img src="https://upload.wikimedia.org/wikipedia/commons/1/12/Google_Drive_icon_%282020%29.svg" class="w-4 h-4 opacity-70 group-hover:opacity-100" />
                                </a>
                            }
                            <button 
                                (click)="deleteDoc(doc)"
                                class="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all" 
                                title="Eliminar">
                              <mat-icon class="!w-4 !h-4 !text-[18px]">delete_outline</mat-icon>
                            </button>
                          </div>
                        </td>
                      </tr>
                    }
                  </tbody>
                </table>
            } @else {
                <!-- Grid View -->
                <div class="p-8 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-8">
                    @for (doc of filteredDocuments; track doc.id) {
                        <div class="bg-gray-50/30 border border-gray-100 p-5 rounded-3xl hover:bg-white hover:shadow-2xl hover:shadow-brand-500/10 hover:border-brand-200 transition-all group cursor-pointer relative overflow-hidden">
                            <div class="flex justify-between items-start mb-5">
                                <div class="p-3.5 rounded-2xl shadow-sm transition-all group-hover:rotate-3 group-hover:scale-110" [class]="getDocIcon(doc.mime_type).bg">
                                    <mat-icon class="!w-7 !h-7 !text-[28px]" [class]="getDocIcon(doc.mime_type).color">
                                        {{ getDocIcon(doc.mime_type).icon }}
                                    </mat-icon>
                                </div>
                                <button (click)="deleteDoc(doc)" class="p-1.5 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all opacity-0 group-hover:opacity-100">
                                    <mat-icon class="!w-4 !h-4 !text-[18px]">close</mat-icon>
                                </button>
                            </div>
                            <h4 class="font-bold text-gray-900 text-sm truncate mb-1" [title]="doc.name">{{ doc.name }}</h4>
                            <div class="flex items-center gap-1.5 mb-5">
                                <span class="text-[9px] font-black text-gray-400 uppercase tracking-widest">{{ getDocType(doc.mime_type) }}</span>
                                <span class="w-1 h-1 rounded-full bg-gray-200"></span>
                                <span class="text-[9px] font-black text-gray-400 uppercase tracking-widest">{{ formatSize(doc.size) }}</span>
                            </div>
                            
                            <div class="pt-4 border-t border-gray-50 flex items-center justify-between">
                                <div class="flex items-center gap-2">
                                    <img [src]="doc.profiles?.avatar_url || 'https://i.pravatar.cc/150?u=' + doc.id" class="w-5 h-5 rounded-full border border-white shadow-sm" />
                                    @if(doc.drive_file_id) {
                                        <mat-icon class="text-emerald-500 !w-3 !h-3 !text-[12px]">cloud_done</mat-icon>
                                    }
                                </div>
                                <a 
                                    [href]="doc.drive_file_id ? 'https://drive.google.com/file/d/' + doc.drive_file_id + '/view' : '#'" 
                                    target="_blank" 
                                    class="text-[10px] font-black text-brand-600 hover:underline uppercase tracking-widest">
                                    ABRIR
                                </a>
                            </div>
                        </div>
                    }
                </div>
            }
          </div>
        </div>
      </div>
    </div>
  `
})
export class DocumentsComponent implements OnInit {
  private supabase = inject(SupabaseService);
  private cdr = inject(ChangeDetectorRef);

  documents: any[] = [];
  filteredDocuments: any[] = [];
  isLoading = true;
  viewMode: 'list' | 'grid' = 'list';
  searchQuery = '';
  currentFolder = 'all';

  fileTypes = [
    { id: 'pdf', name: 'PDFs', mime: 'application/pdf', checked: true },
    { id: 'word', name: 'Documentos Word', mime: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', checked: true },
    { id: 'excel', name: 'Hojas de cálculo', mime: 'spreadsheet', checked: true },
    { id: 'image', name: 'Imágenes', mime: 'image/', checked: true },
    { id: 'other', name: 'Otros archivos', mime: 'other', checked: true }
  ];

  ngOnInit() {
    this.loadDocuments();
  }

  async loadDocuments() {
    this.isLoading = true;
    this.cdr.markForCheck();
    try {
      this.documents = await this.supabase.getDocuments();
      this.applyFilters();
    } catch (error) {
      console.error("Error al cargar documentos:", error);
    } finally {
      this.isLoading = false;
      this.cdr.markForCheck();
    }
  }

  applyFilters() {
    let result = [...this.documents];

    if (this.searchQuery) {
      const query = this.searchQuery.toLowerCase();
      result = result.filter(d =>
        d.name.toLowerCase().includes(query) ||
        d.projects?.name?.toLowerCase().includes(query)
      );
    }

    if (this.currentFolder === 'clients') {
      result = result.filter(d => d.client_id !== null);
    } else if (this.currentFolder === 'projects') {
      result = result.filter(d => d.project_id !== null);
    }

    const checkedTypes = this.fileTypes.filter(t => t.checked);

    result = result.filter(d => {
      return checkedTypes.some(type => {
        const mime = type.mime;
        if (mime === 'other') {
          // Check if it doesn't match any of the SPECIFIC filters
          const matchesSpecific = this.fileTypes
            .filter(t => t.id !== 'other')
            .some(t => {
              if (t.mime === 'spreadsheet') return d.mime_type?.includes('spreadsheet') || d.mime_type?.includes('excel') || d.mime_type?.includes('csv');
              if (t.mime.endsWith('/')) return d.mime_type?.startsWith(t.mime);
              return d.mime_type === t.mime;
            });
          return !matchesSpecific;
        }
        if (mime === 'spreadsheet') return d.mime_type?.includes('spreadsheet') || d.mime_type?.includes('excel') || d.mime_type?.includes('csv');
        if (mime.endsWith('/')) return d.mime_type?.startsWith(mime);
        return d.mime_type === mime;
      });
    });

    this.filteredDocuments = result;
    this.cdr.markForCheck();
  }

  filterFolder(folder: string) {
    this.currentFolder = folder;
    this.applyFilters();
  }

  async onFileSelected(event: any) {
    const file: File = event.target.files[0];
    if (!file) return;

    this.isLoading = true;
    this.cdr.markForCheck();

    try {
      // Perform the dual sync (Google Drive + Supabase Storage + DB)
      await this.supabase.uploadDocument(file);
      await this.loadDocuments();
    } catch (error) {
      console.error("Error subiendo archivo:", error);
      alert('Error al sincronizar con Google Drive. Verifica la conexión.');
    } finally {
      this.isLoading = false;
      this.cdr.markForCheck();
    }
  }

  async deleteDoc(doc: any) {
    if (!confirm(`¿Estás seguro de eliminar "${doc.name}"? Se eliminará del dashboard pero se mantendrá en tu histórico de Drive.`)) return;

    this.isLoading = true;
    this.cdr.markForCheck();

    try {
      await this.supabase.deleteDocument(doc.id, doc.storage_path);
      await this.loadDocuments();
    } catch (error) {
      console.error("Error eliminando documento:", error);
    } finally {
      this.isLoading = false;
      this.cdr.markForCheck();
    }
  }

  getDocIcon(mime: string) {
    if (!mime) return { icon: 'insert_drive_file', bg: 'bg-gray-50', color: 'text-gray-600' };
    if (mime.startsWith('image/')) return { icon: 'image', bg: 'bg-indigo-50', color: 'text-indigo-600' };
    if (mime.includes('pdf')) return { icon: 'picture_as_pdf', bg: 'bg-red-50', color: 'text-red-600' };
    if (mime.includes('spreadsheet') || mime.includes('excel') || mime.includes('csv')) return { icon: 'table_view', bg: 'bg-emerald-50', color: 'text-emerald-600' };
    if (mime.includes('word') || mime.includes('document')) return { icon: 'description', bg: 'bg-blue-50', color: 'text-blue-600' };
    return { icon: 'insert_drive_file', bg: 'bg-gray-50', color: 'text-gray-600' };
  }

  getDocType(mime: string) {
    if (!mime) return 'Archivo';
    if (mime.startsWith('image/')) return 'Imagen';
    if (mime.includes('pdf')) return 'PDF';
    if (mime.includes('spreadsheet') || mime.includes('excel') || mime.includes('csv')) return 'Excel/CSV';
    if (mime.includes('word') || mime.includes('document')) return 'Documento';
    return 'Archivo';
  }

  formatSize(bytes: number) {
    if (!bytes) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  }
}
