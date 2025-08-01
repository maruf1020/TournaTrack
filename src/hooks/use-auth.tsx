"use client";

import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { onAuthStateChanged, User } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { useRouter, usePathname } from 'next/navigation';

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
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setLoading(true);
      if (user) {
        setUser(user);
        // In a real app, you would check for a custom claim or a role in your database.
        // For this demo, we'll hardcode the admin check based on email.
        const isAdminUser = user.email === 'admin@echologyx.com';
        setIsAdmin(isAdminUser);
        
        // If user is on login page, redirect to dashboard
        if (pathname === '/login') {
            router.push('/');
        }
      } else {
        setUser(null);
        setIsAdmin(false);
        // If user is not logged in and tries to access a protected route, redirect to login
        // For now, only /admin is protected, but you could expand this.
        if (pathname === '/admin') {
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
