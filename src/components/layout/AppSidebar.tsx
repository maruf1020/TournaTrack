
'use client';

import { usePathname } from 'next/navigation';
import Link from 'next/link';
import {
  Sidebar,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarFooter,
} from '@/components/ui/sidebar';
import {
  LayoutDashboard,
  Flame,
  GitMerge,
  Sword,
  Trophy,
  Settings,
  LogOut,
  LogIn,
  List,
  Sparkles
} from 'lucide-react';
import { useSidebar } from '@/components/ui/sidebar';
import { cn } from '@/lib/utils';
import { useAuth } from '@/hooks/use-auth';
import { auth } from '@/lib/firebase';

const navItems = [
  { href: '/', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/live', label: 'Live Scores', icon: Flame },
  { href: '/matches', label: 'All Matches', icon: List },
  { href: '/tree', label: 'Tournament Tree', icon: GitMerge },
];

const adminNavItems = [
    ...navItems,
    { href: '/admin', label: 'Game Management', icon: Sword },
];

export default function AppSidebar() {
  const pathname = usePathname();
  const { state } = useSidebar();
  const { user, isAdmin, loading } = useAuth();

  const handleLogout = () => {
    auth.signOut();
  };

  const currentNavItems = isAdmin ? adminNavItems : navItems;

  return (
    <Sidebar side="left" className="border-r">
      <SidebarHeader className="h-16 flex items-center p-4">
        <Link href="/" className="flex items-center gap-2">
          <Trophy className="w-8 h-8 text-primary" />
          <h1
            className={cn(
              'text-xl font-bold font-headline transition-opacity duration-200',
              state === 'collapsed' ? 'opacity-0' : 'opacity-100'
            )}
          >
            Tour Console
          </h1>
        </Link>
      </SidebarHeader>

      <SidebarMenu className="flex-1 p-4">
        {currentNavItems.map((item) => (
          <SidebarMenuItem key={item.href}>
            <SidebarMenuButton
              asChild
              isActive={pathname === item.href}
              tooltip={{ children: item.label, side: 'right' }}
            >
              <Link href={item.href}>
                <item.icon />
                <span>{item.label}</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        ))}
      </SidebarMenu>

      <SidebarFooter className="p-4">
        <SidebarMenu>
            {isAdmin && (
                <SidebarMenuItem>
                    <SidebarMenuButton
                        asChild
                        isActive={pathname === '/settings'}
                        tooltip={{ children: 'Settings', side: 'right' }}
                        >
                        <Link href="/settings">
                            <Settings />
                            <span>Settings</span>
                        </Link>
                    </SidebarMenuButton>
                </SidebarMenuItem>
            )}
            <SidebarMenuItem>
                <SidebarMenuButton
                    asChild
                    isActive={pathname === '/about'}
                    tooltip={{ children: 'The Spark', side: 'right' }}
                    >
                    <Link href="/about">
                        <Sparkles />
                        <span>The Spark</span>
                    </Link>
                </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
              {user ? (
                 <SidebarMenuButton onClick={handleLogout} tooltip={{ children: 'Logout', side: 'right' }}>
                    <LogOut/>
                    <span>Logout</span>
                </SidebarMenuButton>
              ) : (
                <SidebarMenuButton asChild tooltip={{ children: 'Login', side: 'right' }}>
                  <Link href="/login">
                      <LogIn/>
                      <span>Login</span>
                  </Link>
              </SidebarMenuButton>
              )}
            </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
