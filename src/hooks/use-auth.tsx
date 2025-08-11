
"use client";

import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { onAuthStateChanged, User } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { useRouter, usePathname } from 'next/navigation';
import { getPlayerByEmail, getPublicSettings } from '@/lib/services';
import type { PublicSettings } from '@/lib/types';

interface AuthContextType {
  user: User | null;
  isAdmin: boolean;
  loading: boolean;
  playerId: string | null;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  isAdmin: false,
  loading: true,
  playerId: null,
});

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [playerId, setPlayerId] = useState<string | null>(null);
  const [settings, setSettings] = useState<PublicSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    const unsubscribeSettings = getPublicSettings((settingsData) => {
        setSettings(settingsData);
    });

    const unsubscribeAuth = onAuthStateChanged(auth, async (user) => {
      setLoading(true); // Start loading on any auth state change
      if (user && user.email) {
        setUser(user);
        const playerProfile = await getPlayerByEmail(user.email);
        setPlayerId(playerProfile?.id || null);
        
        const isAdminUser = user.email === 'admin@echologyx.com' || (playerProfile?.isAdmin || false);
        setIsAdmin(isAdminUser);
        
        if (pathname === '/login') {
            router.push('/');
        }
      } else {
        setUser(null);
        setIsAdmin(false);
        setPlayerId(null);
        // This check will now happen in the second effect
      }
      // We don't setLoading(false) here. It will be handled in the next effect
      // to ensure both settings and auth are loaded.
    });

    return () => {
        unsubscribeSettings();
        unsubscribeAuth();
    };
  }, [router, pathname]);


  useEffect(() => {
    // This effect handles redirection based on settings and auth state
    if (settings === null) {
        // Don't do anything until settings are resolved.
        // The initial loading state is true, so nothing will render yet.
        return;
    }

    const isLoggedIn = !!user;
    const isLoginPage = pathname === '/login';

    if (settings.requireLoginToView && !isLoggedIn && !isLoginPage) {
        router.push('/login');
    } else if (isAdmin && isLoginPage) {
        router.push('/');
    } else if (!isAdmin) {
        const adminRoutes = ['/admin', '/settings'];
        if (adminRoutes.some(route => pathname.startsWith(route))) {
            router.push('/');
        }
    }
    
    // All checks are done, we can now allow rendering.
    setLoading(false);

  }, [user, settings, isAdmin, pathname, router]);


  const value = { user, isAdmin, loading, playerId };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  return useContext(AuthContext);
};
