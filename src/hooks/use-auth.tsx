
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
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  isAdmin: false,
  loading: true,
});

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setLoading(true);
      if (user && user.email) {
        setUser(user);
        const playerProfile = await getPlayerByEmail(user.email);
        // User is admin if their email is the default admin email OR if their profile has isAdmin set to true.
        const isAdminUser = user.email === 'admin@echologyx.com' || (playerProfile?.isAdmin || false);
        setIsAdmin(isAdminUser);
        
        if (pathname === '/login') {
            router.push('/');
        }
      } else {
        setUser(null);
        setIsAdmin(false);
        const protectedRoutes = ['/admin', '/settings'];
        if (protectedRoutes.includes(pathname)) {
            router.push('/login');
        }
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, [router, pathname]);

  const value = { user, isAdmin, loading };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  return useContext(AuthContext);
};
