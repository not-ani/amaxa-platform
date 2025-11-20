import { useEffect } from 'react';
import { useAuth } from '@workos/authkit-tanstack-react-start/client';
import { useConvexMutation } from '@convex-dev/react-query';
import { api } from '@convex/_generated/api';

/**
 * Hook to sync current user's information to Convex
 * Call this in authenticated routes/components
 */
export function useSyncUser() {
  const { user } = useAuth();
  const syncUser = useConvexMutation(api.users.syncCurrentUser);

  useEffect(() => {
    if (user) {
      syncUser({
        firstName: user.firstName ?? undefined,
        lastName: user.lastName ?? undefined,
        email: user.email ?? undefined,
        profilePictureUrl: user.profilePictureUrl ?? undefined,
      }).catch((error) => {
        console.error('Failed to sync user:', error);
      });
    }
  }, [user, syncUser]);
}

