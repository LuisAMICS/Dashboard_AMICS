import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { filter, map, take } from 'rxjs';

export const authGuard: CanActivateFn = (route, state) => {
    const authService = inject(AuthService);
    const router = inject(Router);

    // Wait until the auth state is initialized from the session
    return authService.isInitialized$.pipe(
        filter(initialized => initialized), // Only proceed when initialized is true
        take(1), // Complete the observable after the first true value
        map(() => {
            const user = authService.currentUserValue;
            if (user) {
                return true;
            }

            // Redirect to login if not authenticated
            router.navigate(['/login']);
            return false;
        })
    );
};
