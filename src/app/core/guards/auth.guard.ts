import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { filter, map, take } from 'rxjs';

export const authGuard: CanActivateFn = (route, state) => {
    const authService = inject(AuthService);
    const router = inject(Router);

    // Wait until the auth state is initialized from the session, but don't hang for more than 5 seconds
    return authService.isInitialized$.pipe(
        filter(initialized => initialized), // Only proceed when initialized is true
        take(1), // Complete the observable after the first true value
        map(() => {
            const user = authService.currentUserValue;
            console.log('AuthGuard: Evaluating user session', !!user);
            if (user) {
                return true;
            }

            // Redirect to login if not authenticated
            console.warn('AuthGuard: No session found, redirecting to login');
            router.navigate(['/login']);
            return false;
        })
    );
};
