import { ChangeDetectionStrategy, ChangeDetectorRef, Component, inject, OnInit } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SupabaseService } from '../../core/services/supabase.service';

@Component({
  selector: 'app-calendar',
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
                <p class="mt-4 text-sm font-medium text-gray-600">Sincronizando agenda...</p>
            </div>
        </div>
      }

      <!-- Header -->
      <div class="flex items-center justify-between mb-6 flex-shrink-0 px-1">
        <div>
          <h1 class="text-2xl font-display font-bold text-gray-900 tracking-tight">Calendario</h1>
          <p class="text-sm text-gray-500 mt-1">Gestiona tus reuniones, seguimientos y fechas límite.</p>
        </div>
        <div class="flex items-center gap-3">
          <div class="flex items-center gap-2 bg-white border border-gray-200 rounded-xl p-1 shadow-sm">
            <button (click)="previousMonth()" class="p-1.5 text-gray-400 hover:text-brand-600 hover:bg-brand-50 rounded-lg transition-all active:scale-90">
              <mat-icon class="!w-5 !h-5 !text-[20px]">chevron_left</mat-icon>
            </button>
            <span class="text-sm font-bold text-gray-900 px-3 min-w-[120px] text-center capitalize">{{ monthName }} {{ currentYear }}</span>
            <button (click)="nextMonth()" class="p-1.5 text-gray-400 hover:text-brand-600 hover:bg-brand-50 rounded-lg transition-all active:scale-90">
              <mat-icon class="!w-5 !h-5 !text-[20px]">chevron_right</mat-icon>
            </button>
          </div>
          
          <button (click)="goToToday()" class="px-4 py-2 bg-white border border-gray-200 text-gray-700 rounded-xl text-sm font-bold hover:bg-gray-50 transition-all shadow-sm active:scale-95">
            Hoy
          </button>

          <button (click)="openNewMeetingPanel()" class="flex items-center gap-2 bg-brand-600 hover:bg-brand-700 text-white px-4 py-2 rounded-xl text-sm font-bold transition-all shadow-lg shadow-brand-500/20 active:scale-95">
            <mat-icon class="!w-4 !h-4 !text-[16px]">add</mat-icon>
            Nueva Reunión
          </button>
        </div>
      </div>

      <!-- Calendar Grid -->
      <div class="flex-1 bg-white rounded-2xl border border-gray-200/80 shadow-xl shadow-gray-200/40 overflow-hidden flex flex-col">
        <!-- Days Header -->
        <div class="grid grid-cols-7 border-b border-gray-100 bg-gray-50/30">
          @for (day of ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom']; track day) {
            <div class="px-4 py-3 text-[10px] font-bold text-gray-400 uppercase tracking-widest text-center border-r border-gray-100 last:border-r-0">
              {{ day }}
            </div>
          }
        </div>
        
        <!-- Calendar Body -->
        <div class="flex-1 grid grid-cols-7 auto-rows-fr overflow-y-auto custom-scrollbar">
          @for (cell of calendarCells; track cell.id) {
            <div 
                class="border-r border-b border-gray-50 last:border-r-0 p-2 min-h-[100px] transition-all hover:bg-brand-50/10 group relative" 
                [class.bg-gray-50/50]="cell.isOutsideMonth"
                (dblclick)="openNewMeetingPanel(cell.date)">
              
              <div class="flex justify-between items-start mb-1">
                <span class="text-xs font-bold w-6 h-6 flex items-center justify-center rounded-lg transition-colors" 
                      [class]="cell.isToday ? 'bg-brand-600 text-white shadow-lg shadow-brand-500/30' : (cell.isOutsideMonth ? 'text-gray-300' : 'text-gray-900 group-hover:text-brand-600')">
                  {{ cell.day }}
                </span>
                @if (!cell.isOutsideMonth && cell.events.length > 0) {
                    <span class="text-[9px] font-bold text-gray-400 group-hover:text-brand-400">{{ cell.events.length }}</span>
                }
              </div>
              
              <div class="space-y-1 mt-1 overflow-hidden">
                @for (event of cell.events; track event.id) {
                  <div 
                    (click)="editMeeting(event)"
                    class="px-2 py-1 text-[10px] font-bold rounded-lg truncate cursor-pointer hover:scale-[1.02] active:scale-95 transition-all shadow-sm border-l-2" 
                    [class]="getEventClass(event)">
                    <span class="opacity-70 mr-1">{{ event.start_at | date:'HH:mm' }}</span>
                    {{ event.title }}
                  </div>
                }
              </div>

              <!-- Double Click Hint -->
              <div class="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-10 pointer-events-none transition-opacity">
                <mat-icon class="!w-8 !h-8 !text-[32px] text-brand-600">add</mat-icon>
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
            <h2 class="text-xl font-display font-bold text-gray-900">{{ isEditing ? 'Detalles de Reunión' : 'Nueva Reunión' }}</h2>
            <p class="text-xs text-gray-500 mt-0.5">Organiza tu agenda y objetivos.</p>
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
                <label class="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Asunto de la Reunión</label>
                <input [(ngModel)]="currentMeeting.title" type="text" placeholder="Ej: Kickoff Proyecto Fintech" class="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:ring-4 focus:ring-brand-500/10 focus:border-brand-500 outline-none transition-all bg-gray-50/30 font-bold" />
            </div>

            <div class="grid grid-cols-2 gap-4">
                <div class="space-y-1.5">
                    <label class="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Inicio</label>
                    <input [(ngModel)]="currentMeeting.start_time" type="datetime-local" class="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:ring-4 focus:ring-brand-500/10 focus:border-brand-500 outline-none transition-all bg-white font-medium" />
                </div>
                <div class="space-y-1.5">
                    <label class="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Fin</label>
                    <input [(ngModel)]="currentMeeting.end_time" type="datetime-local" class="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:ring-4 focus:ring-brand-500/10 focus:border-brand-500 outline-none transition-all bg-white font-medium" />
                </div>
            </div>

            <div class="space-y-1.5">
                <label class="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Relacionado con Proyecto</label>
                <select [(ngModel)]="currentMeeting.project_id" class="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:ring-4 focus:ring-brand-500/10 focus:border-brand-500 outline-none transition-all bg-white font-medium">
                    <option [ngValue]="null">-- Ninguno (Reunión General) --</option>
                    @for(p of projectsList; track p.id) {
                        <option [ngValue]="p.id">{{ p.name }}</option>
                    }
                </select>
            </div>

            <div class="space-y-1.5">
                <label class="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Enlace de la Reunión</label>
                <div class="relative group">
                    <mat-icon class="absolute left-3 top-1/2 -translate-y-1/2 !w-4 !h-4 !text-[16px] text-gray-400 group-focus-within:text-brand-600">videocam</mat-icon>
                    <input [(ngModel)]="currentMeeting.meeting_link" type="url" placeholder="Ej: https://meet.google.com/..." class="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl text-sm focus:ring-4 focus:ring-brand-500/10 focus:border-brand-500 outline-none transition-all bg-white font-medium" />
                </div>
            </div>

            @if (isEditing && currentMeeting.meeting_link) {
                <a [href]="currentMeeting.meeting_link" target="_blank" class="flex items-center justify-center gap-2 w-full py-4 bg-emerald-50 text-emerald-700 rounded-2xl text-sm font-bold border border-emerald-100 hover:bg-emerald-100 transition-colors">
                    <mat-icon>open_in_new</mat-icon>
                    UNIRSE A LA REUNIÓN
                </a>
            }
        </div>

        <div class="p-6 border-t border-gray-100 flex items-center gap-3">
          @if (isEditing) {
            <button 
                (click)="deleteMeeting()"
                [disabled]="isSaving"
                class="w-12 h-12 flex items-center justify-center border border-red-100 text-red-500 rounded-xl hover:bg-red-50 transition-colors disabled:opacity-50 active:scale-95">
                <mat-icon>delete_outline</mat-icon>
            </button>
          }
          <button (click)="closePanel()" class="flex-1 py-4 border border-gray-200 text-gray-700 rounded-xl text-sm font-bold hover:bg-gray-50 transition-all active:scale-95">
            Cancelar
          </button>
          <button 
            (click)="saveMeeting()"
            [disabled]="isSaving"
            class="flex-[2] py-4 bg-brand-600 hover:bg-brand-700 text-white rounded-xl text-sm font-bold transition-all shadow-lg shadow-brand-500/20 active:scale-95 disabled:bg-brand-400 flex items-center justify-center gap-2">
            @if (isSaving) {
                <div class="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
            }
            {{ isEditing ? 'Guardar Cambios' : 'Agendar Reunión' }}
          </button>
        </div>
      </div>
    </div>
  `
})
export class CalendarComponent implements OnInit {
  private supabase = inject(SupabaseService);
  private cdr = inject(ChangeDetectorRef);

  isLoading = true;
  isSaving = false;
  isPanelOpen = false;
  isEditing = false;
  errorMessage = '';

  currentDate = new Date();
  currentMonth = this.currentDate.getMonth();
  currentYear = this.currentDate.getFullYear();

  calendarCells: any[] = [];
  meetingsList: any[] = [];
  projectsList: any[] = [];
  currentMeeting: any = {};

  monthNames = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];

  get monthName() {
    return this.monthNames[this.currentMonth];
  }

  ngOnInit() {
    this.loadData();
  }

  async loadData() {
    this.isLoading = true;
    this.cdr.markForCheck();
    try {
      const [meetings, projects] = await Promise.all([
        this.supabase.getMeetings(),
        this.supabase.getProjects()
      ]);
      this.meetingsList = meetings;
      this.projectsList = projects;
      this.generateCalendar();
    } catch (error) {
      console.error("Error loading calendar data:", error);
    } finally {
      this.isLoading = false;
      this.cdr.markForCheck();
    }
  }

  generateCalendar() {
    const firstDayOfMonth = new Date(this.currentYear, this.currentMonth, 1);
    const lastDayOfMonth = new Date(this.currentYear, this.currentMonth + 1, 0);

    // Get start day (0 = Sunday, 1 = Monday...) -> We want Monday as 0
    let startDayIdx = firstDayOfMonth.getDay() - 1;
    if (startDayIdx === -1) startDayIdx = 6; // Sunday fix

    const cells = [];

    // Previous Month Days
    const prevMonthLastDay = new Date(this.currentYear, this.currentMonth, 0).getDate();
    for (let i = startDayIdx - 1; i >= 0; i--) {
      cells.push(this.createCell(prevMonthLastDay - i, true, true));
    }

    // Current Month Days
    const today = new Date();
    for (let i = 1; i <= lastDayOfMonth.getDate(); i++) {
      const date = new Date(this.currentYear, this.currentMonth, i);
      const isToday = date.toDateString() === today.toDateString();
      cells.push(this.createCell(i, false, isToday));
    }

    // Next Month Days
    const remainingCells = 42 - cells.length; // Standard 6 rows
    for (let i = 1; i <= remainingCells; i++) {
      cells.push(this.createCell(i, true, false, true));
    }

    this.calendarCells = cells;
  }

  createCell(day: number, isOutsideMonth: boolean, isToday: boolean, isNextMonth: boolean = false) {
    let year = this.currentYear;
    let month = this.currentMonth;

    if (isOutsideMonth) {
      if (isNextMonth) {
        month = (this.currentMonth + 1) % 12;
        if (month === 0) year++;
      } else {
        month = (this.currentMonth - 1 + 12) % 12;
        if (month === 11) year--;
      }
    }

    const cellDate = new Date(year, month, day);
    const dateStr = cellDate.toISOString().split('T')[0];

    const dayEvents = this.meetingsList.filter(m => {
      const mDate = new Date(m.start_at).toISOString().split('T')[0];
      return mDate === dateStr;
    });

    return {
      id: `${year}-${month}-${day}`,
      day,
      date: cellDate,
      isOutsideMonth,
      isToday,
      events: dayEvents
    };
  }

  previousMonth() {
    if (this.currentMonth === 0) {
      this.currentMonth = 11;
      this.currentYear--;
    } else {
      this.currentMonth--;
    }
    this.generateCalendar();
  }

  nextMonth() {
    if (this.currentMonth === 11) {
      this.currentMonth = 0;
      this.currentYear++;
    } else {
      this.currentMonth++;
    }
    this.generateCalendar();
  }

  goToToday() {
    this.currentDate = new Date();
    this.currentMonth = this.currentDate.getMonth();
    this.currentYear = this.currentDate.getFullYear();
    this.generateCalendar();
  }

  getEventClass(event: any) {
    if (event.projects?.name?.toLowerCase().includes('crm')) return 'bg-blue-50 text-blue-700 border-blue-200';
    if (event.meeting_link) return 'bg-emerald-50 text-emerald-700 border-emerald-200';
    return 'bg-brand-50 text-brand-700 border-brand-200';
  }

  openNewMeetingPanel(date: Date = new Date()) {
    this.isEditing = false;
    this.isPanelOpen = true;
    this.errorMessage = '';

    // Default to selected date + 1 hour from now
    const start = new Date(date);
    start.setHours(new Date().getHours() + 1, 0, 0, 0);
    const end = new Date(start);
    end.setHours(start.getHours() + 1);

    this.currentMeeting = {
      title: '',
      start_time: this.formatDateForInput(start),
      end_time: this.formatDateForInput(end),
      project_id: null,
      meeting_link: ''
    };
    this.cdr.markForCheck();
  }

  editMeeting(meeting: any) {
    this.isEditing = true;
    this.isPanelOpen = true;
    this.errorMessage = '';
    this.currentMeeting = {
      ...meeting,
      start_time: this.formatDateForInput(new Date(meeting.start_at)),
      end_time: this.formatDateForInput(new Date(meeting.end_at))
    };
    this.cdr.markForCheck();
  }

  closePanel() {
    this.isPanelOpen = false;
    this.cdr.markForCheck();
  }

  async saveMeeting() {
    if (!this.currentMeeting.title?.trim()) {
      this.errorMessage = 'El asunto es obligatorio.';
      return;
    }

    this.isSaving = true;
    this.errorMessage = '';
    this.cdr.markForCheck();

    try {
      const payload = {
        title: this.currentMeeting.title,
        start_at: new Date(this.currentMeeting.start_time).toISOString(),
        end_at: new Date(this.currentMeeting.end_time).toISOString(),
        project_id: this.currentMeeting.project_id,
        meeting_link: this.currentMeeting.meeting_link
      };

      if (this.isEditing) {
        await this.supabase.updateMeeting(this.currentMeeting.id, payload);
      } else {
        await this.supabase.createMeeting(payload);
      }

      this.closePanel();
      await this.loadData();
    } catch (error: any) {
      console.error("Error saving meeting:", error);
      this.errorMessage = 'No se pudo agendar la reunión.';
    } finally {
      this.isSaving = false;
      this.cdr.markForCheck();
    }
  }

  async deleteMeeting() {
    if (!confirm('¿Deseas cancelar esta reunión?')) return;

    this.isSaving = true;
    this.cdr.markForCheck();

    try {
      await this.supabase.deleteMeeting(this.currentMeeting.id);
      this.closePanel();
      await this.loadData();
    } catch (error) {
      console.error("Error deleting meeting:", error);
      this.errorMessage = 'Error al cancelar la reunión.';
    } finally {
      this.isSaving = false;
      this.cdr.markForCheck();
    }
  }

  formatDateForInput(date: Date) {
    const tzoffset = date.getTimezoneOffset() * 60000;
    return new Date(date.getTime() - tzoffset).toISOString().slice(0, 16);
  }
}
