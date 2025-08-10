
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
  Sparkles,
  ChevronDown,
  Gamepad2,
  CalendarDays,
  Briefcase,
  Map,
  Users,
  Shield,
  BedDouble,
} from 'lucide-react';
import { useSidebar } from '@/components/ui/sidebar';
import { cn } from '@/lib/utils';
import { useAuth } from '@/hooks/use-auth';
import { auth } from '@/lib/firebase';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '../ui/collapsible';
import * as React from 'react';

const gameNavItems = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/live', label: 'Live Scores', icon: Flame },
  { href: '/matches', label: 'All Matches', icon: List },
  { href: '/tree', label: 'Tournament Tree', icon: GitMerge },
];

const eventNavItems = [
  { href: '/events/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/events/upcoming', label: 'Upcoming', icon: CalendarDays },
  { href: '/events/map', label: 'Event Map', icon: Map },
];

const employeeNavItems = [
  { href: '/employees', label: 'Directory', icon: Users },
];

const roomNavItems = [
  { href: '/rooms', label: 'View Assignments', icon: BedDouble },
];

const adminNavItems = [
  { href: '/admin', label: 'Game Management', icon: Sword },
  { href: '/admin/events', label: 'Event Management', icon: Briefcase },
  { href: '/admin/employees', label: 'Manage Employees', icon: Users },
  { href: '/admin/rooms', label: 'Manage Rooms', icon: BedDouble },
  { href: '/settings', label: 'Settings', icon: Settings },
];

export default function AppSidebar() {
  const pathname = usePathname();
  const { state } = useSidebar();
  const { user, isAdmin } = useAuth();

  const [openMenus, setOpenMenus] = React.useState<Set<string>>(new Set());

  const toggleMenu = (menuName: string) => {
    setOpenMenus(prev => {
      const newSet = new Set(prev);
      if (newSet.has(menuName)) {
        newSet.delete(menuName);
      } else {
        newSet.add(menuName);
      }
      return newSet;
    });
  };

  React.useEffect(() => {
    setOpenMenus(prev => {
      const newSet = new Set(prev);
      if (pathname.startsWith('/dashboard') || pathname.startsWith('/live') || pathname.startsWith('/matches') || pathname.startsWith('/tree')) {
        newSet.add('Games');
      }
      if (pathname.startsWith('/events/')) {
        newSet.add('Events');
      }
      if (pathname.startsWith('/employees')) {
        newSet.add('Employees');
      }
      if (pathname.startsWith('/rooms')) {
        newSet.add('Rooms');
      }
      if (pathname.startsWith('/admin') || pathname === '/settings') {
        newSet.add('Admin');
      }
      return newSet;
    });
  }, [pathname]);

  const handleLogout = () => {
    auth.signOut();
  };

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

      <SidebarMenu className="flex-1 p-4 space-y-1">
        <SidebarMenuItem>
          <SidebarMenuButton
            asChild
            variant="default"
            isActive={pathname === '/'}
            tooltip={{ children: 'Global Dashboard', side: 'right' }}
            className="h-10"
          >
            <Link href="/" className="flex items-center gap-3">
              <LayoutDashboard className="h-4 w-4" />
              <span>Dashboard</span>
            </Link>
          </SidebarMenuButton>
        </SidebarMenuItem>

        {/* Games Menu */}
        <Collapsible 
          open={openMenus.has('Games')} 
          onOpenChange={() => toggleMenu('Games')}
        >
          <CollapsibleTrigger asChild>
            <SidebarMenuButton
              variant="default"
              className={cn(
                "w-full justify-between h-10", 
                state === 'collapsed' && "justify-center"
              )}
              tooltip={{ children: 'Games', side: 'right' }}
            >
              <div className="flex items-center gap-3">
                <Gamepad2 className="h-4 w-4" />
                <span className={cn(state === 'collapsed' && 'hidden')}>Games</span>
              </div>
              <ChevronDown 
                className={cn(
                  "h-4 w-4 transition-transform duration-200", 
                  openMenus.has('Games') && 'rotate-180', 
                  state === 'collapsed' && 'hidden'
                )} 
              />
            </SidebarMenuButton>
          </CollapsibleTrigger>
          <CollapsibleContent 
            className={cn(
              "overflow-hidden transition-all duration-200", 
              state === 'collapsed' && 'hidden'
            )}
          >
            <div className="ml-4 mt-1 space-y-1">
              {gameNavItems.map((item) => (
                <SidebarMenuItem key={item.href}>
                  <SidebarMenuButton
                    asChild
                    variant="ghost"
                    size="sm"
                    isActive={pathname === item.href}
                    tooltip={{ children: item.label, side: 'right' }}
                    className="h-9"
                  >
                    <Link href={item.href} className="flex items-center gap-3">
                      <item.icon className="h-4 w-4" />
                      <span>{item.label}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </div>
          </CollapsibleContent>
        </Collapsible>

        {/* Events Menu */}
        <Collapsible 
          open={openMenus.has('Events')} 
          onOpenChange={() => toggleMenu('Events')}
        >
          <CollapsibleTrigger asChild>
            <SidebarMenuButton
              variant="default"
              className={cn(
                "w-full justify-between h-10", 
                state === 'collapsed' && "justify-center"
              )}
              tooltip={{ children: 'Events', side: 'right' }}
            >
              <div className="flex items-center gap-3">
                <CalendarDays className="h-4 w-4" />
                <span className={cn(state === 'collapsed' && 'hidden')}>Events</span>
              </div>
              <ChevronDown 
                className={cn(
                  "h-4 w-4 transition-transform duration-200", 
                  openMenus.has('Events') && 'rotate-180', 
                  state === 'collapsed' && 'hidden'
                )} 
              />
            </SidebarMenuButton>
          </CollapsibleTrigger>
          <CollapsibleContent 
            className={cn(
              "overflow-hidden transition-all duration-200", 
              state === 'collapsed' && 'hidden'
            )}
          >
            <div className="ml-4 mt-1 space-y-1">
              {eventNavItems.map((item) => (
                <SidebarMenuItem key={item.href}>
                  <SidebarMenuButton
                    asChild
                    variant="ghost"
                    size="sm"
                    isActive={pathname === item.href}
                    tooltip={{ children: item.label, side: 'right' }}
                    className="h-9"
                  >
                    <Link href={item.href} className="flex items-center gap-3">
                      <item.icon className="h-4 w-4" />
                      <span>{item.label}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </div>
          </CollapsibleContent>
        </Collapsible>

        {/* Employees Menu */}
        <Collapsible 
          open={openMenus.has('Employees')} 
          onOpenChange={() => toggleMenu('Employees')}
        >
          <CollapsibleTrigger asChild>
            <SidebarMenuButton
              variant="default"
              className={cn(
                "w-full justify-between h-10", 
                state === 'collapsed' && "justify-center"
              )}
              tooltip={{ children: 'Employees', side: 'right' }}
            >
              <div className="flex items-center gap-3">
                <Users className="h-4 w-4" />
                <span className={cn(state === 'collapsed' && 'hidden')}>Employees</span>
              </div>
              <ChevronDown 
                className={cn(
                  "h-4 w-4 transition-transform duration-200", 
                  openMenus.has('Employees') && 'rotate-180', 
                  state === 'collapsed' && 'hidden'
                )} 
              />
            </SidebarMenuButton>
          </CollapsibleTrigger>
          <CollapsibleContent 
            className={cn(
              "overflow-hidden transition-all duration-200", 
              state === 'collapsed' && 'hidden'
            )}
          >
            <div className="ml-4 mt-1 space-y-1">
              {employeeNavItems.map((item) => (
                <SidebarMenuItem key={item.href}>
                  <SidebarMenuButton
                    asChild
                    variant="ghost"
                    size="sm"
                    isActive={pathname === item.href}
                    tooltip={{ children: item.label, side: 'right' }}
                    className="h-9"
                  >
                    <Link href={item.href} className="flex items-center gap-3">
                      <item.icon className="h-4 w-4" />
                      <span>{item.label}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </div>
          </CollapsibleContent>
        </Collapsible>

        {/* Room Planner Menu */}
        <Collapsible 
          open={openMenus.has('Rooms')} 
          onOpenChange={() => toggleMenu('Rooms')}
        >
          <CollapsibleTrigger asChild>
            <SidebarMenuButton
              variant="default"
              className={cn(
                "w-full justify-between h-10", 
                state === 'collapsed' && "justify-center"
              )}
              tooltip={{ children: 'Room Planner', side: 'right' }}
            >
              <div className="flex items-center gap-3">
                <BedDouble className="h-4 w-4" />
                <span className={cn(state === 'collapsed' && 'hidden')}>Room Planner</span>
              </div>
              <ChevronDown 
                className={cn(
                  "h-4 w-4 transition-transform duration-200", 
                  openMenus.has('Rooms') && 'rotate-180', 
                  state === 'collapsed' && 'hidden'
                )} 
              />
            </SidebarMenuButton>
          </CollapsibleTrigger>
          <CollapsibleContent 
            className={cn(
              "overflow-hidden transition-all duration-200", 
              state === 'collapsed' && 'hidden'
            )}
          >
            <div className="ml-4 mt-1 space-y-1">
              {roomNavItems.map((item) => (
                <SidebarMenuItem key={item.href}>
                  <SidebarMenuButton
                    asChild
                    variant="ghost"
                    size="sm"
                    isActive={pathname === item.href}
                    tooltip={{ children: item.label, side: 'right' }}
                    className="h-9"
                  >
                    <Link href={item.href} className="flex items-center gap-3">
                      <item.icon className="h-4 w-4" />
                      <span>{item.label}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </div>
          </CollapsibleContent>
        </Collapsible>

        {/* Admin Menu - only shown to admins */}
        {isAdmin && (
          <Collapsible 
            open={openMenus.has('Admin')} 
            onOpenChange={() => toggleMenu('Admin')}
          >
            <CollapsibleTrigger asChild>
              <SidebarMenuButton
                variant="default"
                className={cn(
                  "w-full justify-between h-10", 
                  state === 'collapsed' && "justify-center"
                )}
                tooltip={{ children: 'Admin Panel', side: 'right' }}
              >
                <div className="flex items-center gap-3">
                  <Shield className="h-4 w-4" />
                  <span className={cn(state === 'collapsed' && 'hidden')}>Admin Panel</span>
                </div>
                <ChevronDown 
                  className={cn(
                    "h-4 w-4 transition-transform duration-200", 
                    openMenus.has('Admin') && 'rotate-180', 
                    state === 'collapsed' && 'hidden'
                  )} 
                />
              </SidebarMenuButton>
            </CollapsibleTrigger>
            <CollapsibleContent 
              className={cn(
                "overflow-hidden transition-all duration-200", 
                state === 'collapsed' && 'hidden'
              )}
            >
              <div className="ml-4 mt-1 space-y-1">
                {adminNavItems.map((item) => (
                  <SidebarMenuItem key={item.href}>
                    <SidebarMenuButton
                      asChild
                      variant="ghost"
                      size="sm"
                      isActive={
                        pathname === item.href || 
                        (pathname.startsWith('/admin/events') && item.href === '/admin/events') || 
                        (pathname.startsWith('/admin/employees') && item.href === '/admin/employees') || 
                        (pathname.startsWith('/admin/rooms') && item.href === '/admin/rooms')
                      }
                      tooltip={{ children: item.label, side: 'right' }}
                      className="h-9"
                    >
                      <Link href={item.href} className="flex items-center gap-3">
                        <item.icon className="h-4 w-4" />
                        <span>{item.label}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </div>
            </CollapsibleContent>
          </Collapsible>
        )}
      </SidebarMenu>

      <SidebarFooter className="p-4">
        <SidebarMenu className="space-y-1">
          <SidebarMenuItem>
            <SidebarMenuButton
              asChild
              isActive={pathname === '/about'}
              tooltip={{ children: 'About', side: 'right' }}
              className="h-10"
            >
              <Link href="/about" className="flex items-center gap-3">
                <Sparkles className="h-4 w-4" />
                <span>About</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            {user ? (
              <SidebarMenuButton 
                onClick={handleLogout} 
                tooltip={{ children: 'Logout', side: 'right' }}
                className="h-10"
              >
                <div className="flex items-center gap-3">
                  <LogOut className="h-4 w-4" />
                  <span>Logout</span>
                </div>
              </SidebarMenuButton>
            ) : (
              <SidebarMenuButton 
                asChild 
                tooltip={{ children: 'Login', side: 'right' }}
                className="h-10"
              >
                <Link href="/login" className="flex items-center gap-3">
                  <LogIn className="h-4 w-4" />
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
