'use client';

import React, { useEffect } from 'react';
import { useUser, useAuth } from '@clerk/nextjs';
import { useSessionStore } from '@/stores/sessionStore';

interface SessionProviderProps {
  children: React.ReactNode;
}

const SessionProvider: React.FC<SessionProviderProps> = ({ children }) => {
  const { isLoaded } = useUser();
  const { isSignedIn } = useAuth();
  const { clearSession } = useSessionStore();

  // Clear session when user signs out
  useEffect(() => {
    if (isLoaded && !isSignedIn) {
      clearSession();
    }
  }, [isLoaded, isSignedIn, clearSession]);

  return <>{children}</>;
};

export default SessionProvider; 