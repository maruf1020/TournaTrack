
"use client";

import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { onAuthStateChanged, User } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { useRouter, usePathname } from 'next/navigation';
import { getPlayerByEmail } from '@/lib/services';

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
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setLoading(true);
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
        const protectedRoutes = ['/admin', '/settings'];
        if (protectedRoutes.includes(pathname)) {
            router.push('/login');
        }
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, [router, pathname]);

  const value = { user, isAdmin, loading, playerId };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  return useContext(AuthContext);
};
