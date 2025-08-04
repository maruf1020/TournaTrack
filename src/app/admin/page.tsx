
'use client';

import * as React from 'react';
import AppLayout from '@/components/layout/AppLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/hooks/use-auth';
import { useRouter } from 'next/navigation';
import { Lock, Loader2, Users, Sword, ListChecks, Download } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import EmployeeManager from '@/components/admin/EmployeeManager';
import CreateMatches from '@/components/admin/CreateMatches';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { ChevronDown } from 'lucide-react';
import { MatchList } from '@/components/matches/MatchList';
import type { Match, Player } from '@/lib/types';
import { format } from 'date-fns';
import * as XLSX from 'xlsx';

type AdminTab = 'manage' | 'create' | 'employees';

function AdminContent({ activeTab, onMatchesCreated }: { activeTab: AdminTab, onMatchesCreated: () => void }) {
  const [filteredMatches, setFilteredMatches] = React.useState<Match[]>([]);

  // This helper now formats multi-player teams into a numbered, multi-line string.
  const getPlayerNames = (players: Player[], placeholder?: string): string => {
    if ((!players || players.length === 0) && placeholder) {
      return placeholder;
    }
    if (!players || players.length === 0) return 'TBD';
    if (players.length === 1) return players[0].name;
    return players.map((p, index) => `${index + 1}. ${p.name}`).join('\n');
  };

  const getWinnerForMatch = (match: Match): string => {
    if (!match.winnerId) return 'TBD';
    
    // For Battle Royale, find the single winner from all players.
    if (match.allPlayers) {
        const winner = match.allPlayers.find(p => p.id === match.winnerId);
        return winner ? winner.name : 'TBD';
    }

    // For team matches, determine which team won.
    const p1Won = match.player1.some(p => p.id === match.winnerId);
    if (p1Won) return getPlayerNames(match.player1);

    const p2Won = match.player2.some(p => p.id === match.winnerId);
    if (p2Won) return getPlayerNames(match.player2);
    
    return 'TBD';
  };

  const handleExportJson = () => {
    // Convert date objects to strings for clean export
    const exportData = filteredMatches.map(match => ({
        ...match,
        date: match.date ? format((match.date as any).toDate ? (match.date as any).toDate() : new Date(match.date), 'yyyy-MM-dd') : null,
    }));

    const jsonString = JSON.stringify(exportData, null, 2);
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'matches_export.json';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleExportExcel = () => {
    const dataToExport = filteredMatches.map(match => {
        let team1 = '';
        let team2 = '';

        if (match.allPlayers && match.allPlayers.length > 0) {
            team1 = 'Battle Royale';
            team2 = getPlayerNames(match.allPlayers);
        } else {
            team1 = getPlayerNames(match.player1, match.player1Placeholder);
            team2 = getPlayerNames(match.player2, match.player2Placeholder);
        }

        return {
            'Tournament Name': match.tournamentName,
            'Match Name': match.matchName,
            'Match Type': match.matchType,
            'Team/Player 1': team1,
            'Team/Player 2': team2,
            'Date': match.date && match.isDatePublished ? format((match.date as any).toDate ? (match.date as any).toDate() : new Date(match.date), 'PP') : 'TBD',
            'Status': match.status,
            'Winner': getWinnerForMatch(match)
        };
    });

    const worksheet = XLSX.utils.json_to_sheet(dataToExport);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Matches');

    // Auto-size columns for better readability
    if (dataToExport.length > 0) {
      const cols = Object.keys(dataToExport[0]);
      const colWidths = cols.map(col => ({
          wch: Math.max(...dataToExport.map(row => {
              const cellValue = row[col as keyof typeof row] || '';
              // Handle multi-line cells by finding the longest line
              const lines = cellValue.toString().split('\n');
              return Math.max(...lines.map(line => line.length));
          }), col.length)
      }));
      worksheet['!cols'] = colWidths;
    }
    
    XLSX.writeFile(workbook, 'matches_export.xlsx');
  };


  switch (activeTab) {
    case 'employees':
      return (
        <Card>
          <CardHeader>
            <CardTitle className="font-headline">Employee Management</CardTitle>
            <CardDescription>Add, edit, remove, and import employees. Data is stored live in Firestore.</CardDescription>
          </CardHeader>
          <CardContent>
            <EmployeeManager />
          </CardContent>
        </Card>
      );
    case 'create':
      return (
        <Card>
          <CardHeader>
            <CardTitle className="font-headline">Create Tournament</CardTitle>
            <CardDescription>Select branches, a game, and number of players to automatically generate a full tournament bracket.</CardDescription>
          </CardHeader>
          <CardContent>
            <CreateMatches onMatchesCreated={onMatchesCreated} />
          </CardContent>
        </Card>
      );
    case 'manage':
      return (
        <Card>
          <CardHeader>
            <div className="w-full">
                <CardTitle className="font-headline">Manage Matches</CardTitle>
                <CardDescription>View all matches, assign winners, and advance players to the next round.</CardDescription>
            </div>
            <div className="flex flex-col sm:flex-row gap-2 pt-4">
               <Button variant="outline" onClick={handleExportJson} disabled={filteredMatches.length === 0}>
                  <Download className="mr-2 h-4 w-4" />
                  Export JSON
              </Button>
              <Button variant="outline" onClick={handleExportExcel} disabled={filteredMatches.length === 0}>
                  <Download className="mr-2 h-4 w-4" />
                  Export Excel
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <MatchList isAdmin={true} onFilteredMatchesChange={setFilteredMatches} />
          </CardContent>
        </Card>
      );
    default:
      return null;
  }
}

export default function AdminPage() {
  const { user, isAdmin, loading } = useAuth();
  const router = useRouter();
  const [activeTab, setActiveTab] = React.useState<AdminTab>('manage');
  const [key, setKey] = React.useState(0); // Used to force re-render of ManageMatches

  React.useEffect(() => {
    if (!loading && !isAdmin) {
      router.push('/');
    }
  }, [user, isAdmin, loading, router]);

  const handleMatchesCreated = () => {
    setActiveTab('manage'); // Switch to manage tab
    setKey(prevKey => prevKey + 1); // Force re-render of the ManageMatches component
  };

  if (loading) {
    return (
      <AppLayout>
        <div className="flex-1 flex items-center justify-center">
          <div className="flex items-center gap-2 text-muted-foreground">
            <Loader2 className="h-6 w-6 animate-spin" />
            <span>Loading Admin Panel...</span>
          </div>
        </div>
      </AppLayout>
    );
  }

  if (!isAdmin) {
    return (
      <AppLayout>
        <div className="flex-1 flex flex-col items-center justify-center text-center p-8">
          <Lock className="w-16 h-16 text-destructive mb-4" />
          <h1 className="text-2xl font-bold">Access Denied</h1>
          <p className="text-muted-foreground mt-2">
            You do not have permission to view this page. Please contact an administrator.
          </p>
        </div>
      </AppLayout>
    );
  }

  const menuItems = [
    { id: 'manage', label: 'Manage Matches', icon: ListChecks },
    { id: 'create', label: 'Create Tournament', icon: Sword },
    { id: 'employees', label: 'Manage Employees', icon: Users },
  ];

  const activeMenuItem = menuItems.find(item => item.id === activeTab);

  return (
    <AppLayout>
      <div className="flex-1 space-y-4 p-4 sm:p-8 pt-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <h1 className="text-3xl font-bold tracking-tight font-headline">Admin Panel</h1>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline">
                  {activeMenuItem && <activeMenuItem.icon className="mr-2 h-4 w-4" />}
                  {activeMenuItem?.label}
                  <ChevronDown className="ml-2 h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuLabel>Admin Sections</DropdownMenuLabel>
                <DropdownMenuSeparator />
                {menuItems.map(item => (
                  <DropdownMenuItem key={item.id} onSelect={() => setActiveTab(item.id as AdminTab)}>
                     <item.icon className="mr-2 h-4 w-4" />
                     {item.label}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
        </div>
        
        <div className="mt-6">
            <AdminContent key={key} activeTab={activeTab} onMatchesCreated={handleMatchesCreated} />
        </div>
      </div>
    </AppLayout>
  );
}
