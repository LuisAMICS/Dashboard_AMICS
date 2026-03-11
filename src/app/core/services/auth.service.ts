import { Injectable } from '@angular/core';
import { createClient, SupabaseClient, User } from '@supabase/supabase-js';
import { BehaviorSubject, Observable, from } from 'rxjs';
import { environment } from '../../../environments/environment';

@Injectable({
    providedIn: 'root'
})
export class AuthService {
    readonly supabase: SupabaseClient;
    private _currentUser = new BehaviorSubject<User | null>(null);
    private _isInitialized = new BehaviorSubject<boolean>(false);

    constructor() {
        this.supabase = createClient(environment.supabaseUrl, environment.supabaseKey);

        // getSession() reads synchronously from localStorage — it's fast and
        // reliable for the initial load. This avoids the INITIAL_SESSION race
        // where onAuthStateChange can fire slightly after the guard has already
        // evaluated isInitialized$.
        this.supabase.auth.getSession()
            .then(({ data: { session } }) => {
                this._currentUser.next(session?.user ?? null);
            })
            .catch(err => {
                console.error('AuthService: Failed to get initial session', err);
            })
            .finally(() => {
                // Ensure initialized is always set even on error/timeout
                this._isInitialized.next(true);
            });

        // Continue listening for subsequent changes (login, logout, token refresh).
        this.supabase.auth.onAuthStateChange((event, session) => {
            console.log('AuthService: Auth state change event:', event);
            this._currentUser.next(session?.user ?? null);
            // If for some reason INITIAL_SESSION didn't finish, we do it here too
            if (!this._isInitialized.value) {
                this._isInitialized.next(true);
            }
        });
    }

    get isInitialized$(): Observable<boolean> {
        return this._isInitialized.asObservable();
    }

    get currentUser$(): Observable<User | null> {
        return this._currentUser.asObservable();
    }

    get currentUserValue(): User | null {
        return this._currentUser.value;
    }

    signIn(email: string, password: string) {
        return from(this.supabase.auth.signInWithPassword({ email, password }));
    }

    signOut() {
        return from(this.supabase.auth.signOut());
    }
}

