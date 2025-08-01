'use client';

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { User, LogOut, LogIn } from 'lucide-react';
import { ThemeToggle } from '../theme-toggle';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import { currentUser } from '@/lib/placeholder-data';
import Link from 'next/link';
import { useAuth } from '@/hooks/use-auth';
import { auth } from '@/lib/firebase';
import { useSidebar, SidebarTrigger } from '@/components/ui/sidebar';
import { cn } from '@/lib/utils';
import ClientOnly from '../ClientOnly';

export default function Header() {
  const { user, loading } = useAuth();
  const { state } = useSidebar();

  const handleLogout = () => {
    auth.signOut();
  };

  return (
    <header
      className={cn(
        'sticky top-0 z-30 flex h-14 items-center gap-4 border-b bg-background px-4 sm:px-6',
        'transition-[width] duration-200 ease-linear',
        'md:w-[calc(100%)]',
        'md:group-data-[collapsible=icon]/sidebar-wrapper:w-[calc(100%)]'
      )}
    >
      <ClientOnly>
        <SidebarTrigger className="sm:hidden" />
      </ClientOnly>

      <div className="flex-1" />

      <ThemeToggle />

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="outline"
            size="icon"
            className="overflow-hidden rounded-full"
            disabled={loading}
          >
            {user ? (
              <Avatar>
                <AvatarImage
                  src={currentUser.imageUrl}
                  alt={currentUser.name}
                  data-ai-hint="profile person"
                />
                <AvatarFallback>
                  {user.email?.charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
            ) : (
              <User className="h-5 w-5" />
            )}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          {user ? (
            <>
              <DropdownMenuLabel>{user.email}</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem>
                <User className="mr-2 h-4 w-4" />
                Profile
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleLogout}>
                <LogOut className="mr-2 h-4 w-4" />
                Logout
              </DropdownMenuItem>
            </>
          ) : (
            <DropdownMenuItem asChild>
              <Link href="/login">
                <LogIn className="mr-2 h-4 w-4" />
                Login
              </Link>
            </DropdownMenuItem>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
    </header>
  );
}
