import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { AuthService } from '../../core/services/auth.service';

@Component({
    selector: 'app-login',
    standalone: true,
    imports: [CommonModule, FormsModule, RouterModule, MatIconModule],
    changeDetection: ChangeDetectionStrategy.OnPush,
    template: `
    <div class="min-h-screen bg-[#f8fafc] flex items-center justify-center p-4 relative overflow-hidden">
      <!-- Decorative Background Elements -->
      <div class="absolute -top-24 -left-24 w-96 h-96 bg-brand-500/10 rounded-full blur-3xl"></div>
      <div class="absolute -bottom-24 -right-24 w-96 h-96 bg-brand-600/10 rounded-full blur-3xl"></div>

      <div class="max-w-md w-full relative z-10 transition-all duration-700" [class.opacity-0]="isSuccess" [class.translate-y-4]="isSuccess">
        <!-- Logo/Header -->
        <div class="text-center mb-8">
          <div class="inline-flex items-center justify-center w-48 h-48 bg-white rounded-[3rem] shadow-xl shadow-brand-500/10 mb-4 border border-gray-50 transform hover:scale-110 transition-transform duration-500 p-6">
            <img src="amics-logo.png" alt="AMICS" class="w-full h-full object-contain" />
          </div>
          <p class="text-gray-500 font-medium tracking-wide">Gestiona tu negocio con la potencia de AMICS.</p>
        </div>

        <!-- Login Card -->
        <div class="bg-white rounded-[2.5rem] shadow-2xl shadow-gray-200/50 border border-gray-100 p-10 backdrop-blur-xl bg-white/80">
          <form (keydown.enter)="onLogin()" class="space-y-6">
            <div class="space-y-2">
              <label for="email" class="block text-xs font-black text-gray-400 uppercase tracking-widest ml-1">Email Corporativo</label>
              <div class="relative group">
                <mat-icon class="absolute left-4 top-1/2 -translate-y-1/2 !w-5 !h-5 !text-[20px] text-gray-400 group-focus-within:text-brand-600 transition-colors">mail</mat-icon>
                <input 
                  id="email" 
                  type="email" 
                  [(ngModel)]="email" 
                  name="email"
                  placeholder="ejemplo@amics.com"
                  class="w-full pl-12 pr-4 py-4 bg-gray-50/50 border border-gray-100 rounded-2xl text-sm font-bold focus:bg-white focus:ring-4 focus:ring-brand-500/10 focus:border-brand-500 outline-none transition-all" />
              </div>
            </div>

            <div class="space-y-2">
              <div class="flex justify-between items-center ml-1">
                <label for="password" class="block text-xs font-black text-gray-400 uppercase tracking-widest">Contraseña</label>
                <a href="#" class="text-[11px] font-bold text-brand-600 hover:text-brand-700 transition-colors">¿Olvidaste tu clave?</a>
              </div>
              <div class="relative group">
                <mat-icon class="absolute left-4 top-1/2 -translate-y-1/2 !w-5 !h-5 !text-[20px] text-gray-400 group-focus-within:text-brand-600 transition-colors">lock</mat-icon>
                <input 
                  id="password" 
                  type="password" 
                  [(ngModel)]="password" 
                  name="password"
                  placeholder="••••••••"
                  class="w-full pl-12 pr-4 py-4 bg-gray-50/50 border border-gray-100 rounded-2xl text-sm font-bold focus:bg-white focus:ring-4 focus:ring-brand-500/10 focus:border-brand-500 outline-none transition-all" />
              </div>
            </div>

            @if (errorMessage) {
              <div class="bg-red-50 text-red-600 text-[13px] font-bold p-4 rounded-xl flex items-center gap-3 animate-shake">
                <mat-icon class="!w-5 !h-5 !text-[20px]">error</mat-icon>
                {{ errorMessage }}
              </div>
            }

            <button 
              (click)="onLogin()"
              [disabled]="isLoading"
              class="w-full py-4 bg-brand-600 hover:bg-brand-700 disabled:bg-gray-300 text-white rounded-2xl text-sm font-black uppercase tracking-widest transition-all shadow-lg shadow-brand-500/25 active:scale-95 flex items-center justify-center gap-2">
              @if (isLoading) {
                <div class="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                Accediendo...
              } @else {
                Entrar al Workspace
                <mat-icon class="!w-5 !h-5 !text-[20px]">arrow_forward</mat-icon>
              }
            </button>
          </form>

        </div>
      </div>

      <!-- Success State -->
      @if (isSuccess) {
        <div class="absolute inset-0 flex items-center justify-center z-50 animate-in fade-in zoom-in duration-500">
            <div class="text-center">
                <div class="w-24 h-24 bg-brand-500 text-white rounded-[2rem] flex items-center justify-center mx-auto mb-6 shadow-2xl shadow-brand-500/40 animate-bounce">
                    <mat-icon class="!w-12 !h-12 !text-[48px]">check</mat-icon>
                </div>
                <h2 class="text-3xl font-black text-gray-900 tracking-tight mb-2">¡Bienvenido de nuevo!</h2>
                <p class="text-gray-500 font-bold uppercase tracking-widest text-[11px]">Sincronizando tu espacio de trabajo...</p>
            </div>
        </div>
      }
    </div>
  `,
    styles: [`
    @keyframes shake {
      0%, 100% { transform: translateX(0); }
      25% { transform: translateX(-4px); }
      75% { transform: translateX(4px); }
    }
    .animate-shake { animation: shake 0.4s ease-in-out; }
  `]
})
export class LoginComponent {
    private authService = inject(AuthService);
    private router = inject(Router);

    email = '';
    password = '';
    isLoading = false;
    isSuccess = false;
    errorMessage = '';

    async onLogin() {
        if (!this.email || !this.password) {
            this.errorMessage = 'Por favor, rellena todos los campos.';
            return;
        }

        this.isLoading = true;
        this.errorMessage = '';

        try {
            // Using a race with a timeout of 10s to prevent infinite loading if Supabase hangs
            const loginPromise = this.authService.signIn(this.email, this.password).toPromise();
            const timeoutPromise = new Promise((_, reject) => setTimeout(() => reject(new Error('TIMEOUT')), 10000));

            const { data, error } = await Promise.race([loginPromise, timeoutPromise]) as any;

            if (error) {
                console.error('Login Error:', error);
                this.errorMessage = 'Credenciales inválidas o error de conexión.';
                this.isLoading = false;
                return;
            }

            this.isSuccess = true;
            setTimeout(() => {
                this.router.navigate(['/']);
            }, 1000);

        } catch (err: any) {
            console.error('Technical login error:', err);
            this.errorMessage = err.message === 'TIMEOUT' 
                ? 'El servidor no responde. Revisa tu conexión.' 
                : 'Error técnico de conexión. Inténtalo más tarde.';
        } finally {
            this.isLoading = false;
        }
    }
}
