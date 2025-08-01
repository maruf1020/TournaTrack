
'use client';

import * as React from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter
} from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import {
  GitMerge,
  Trophy,
  Users,
  Loader2,
  Calendar,
  Clock,
  Flame,
  ChevronLeft,
  ChevronRight,
  Gamepad2
} from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import AppLayout from '@/components/layout/AppLayout';
import { currentUser, branches as allBranches } from '@/lib/placeholder-data';
import { cn } from '@/lib/utils';
import type { Match, Player } from '@/lib/types';
import { getPlayers, getMatches } from '@/lib/services';
import { Skeleton } from '@/components/ui/skeleton';
import { format } from 'date-fns';
import Link from 'next/link';
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from '@/components/ui/tooltip';
import { Button } from '@/components/ui/button';
import PlayerTracker from '@/components/dashboard/PlayerTracker';


function DashboardSkeleton() {
  return (
    <div className="flex-1 space-y-4 p-4 sm:p-8 pt-6">
      <div className="flex items-center justify-between">
        <Skeleton className="h-9 w-48" />
        <Skeleton className="h-10 w-48" />
      </div>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Skeleton className="h-28" />
        <Skeleton className="h-28" />
        <Skeleton className="h-28" />
        <Skeleton className="h-28" />
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        <Skeleton className="h-[450px]" />
        <Skeleton className="h-[450px]" />
      </div>
      <Skeleton className="h-96" />
    </div>
  )
}

const PlayerListDisplay = ({ players, isWinner }: { players: Player[], isWinner?: boolean }) => {
  return (
    <div className={cn(isWinner && "font-bold text-emerald-600")}>
      {players.map((p, index) => (
        <div key={p.id}>
          {players.length > 1 && `${index + 1}. `}{p.name}
        </div>
      ))}
    </div>
  );
};

function MatchListCard({ title, icon: Icon, matches, emptyText }: { title: string, icon: React.ElementType, matches: Match[], emptyText: string }) {

  const [currentPage, setCurrentPage] = React.useState(1);
  const itemsPerPage = 5;

  const totalPages = Math.ceil(matches.length / itemsPerPage);
  const displayedMatches = matches.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  return (
    <Card className="flex flex-col">
      <CardHeader>
        <CardTitle className="font-headline flex items-center gap-2">
          <Icon className="h-6 w-6" />
          {title}
        </CardTitle>
        <CardDescription>
          {title === 'Upcoming Matches' ? 'Matches scheduled for the future.' : 'Recently concluded matches.'}
        </CardDescription>
      </CardHeader>
      <CardContent className="flex-grow space-y-4 max-h-[650px] overflow-y-auto">
        {displayedMatches.length > 0 ? (
          <div className="space-y-4">
            {displayedMatches.map(match => {
              const p1IsWinner = match.winnerId && match.player1.some(p => p.id === match.winnerId);
              const p2IsWinner = match.winnerId && match.player2.some(p => p.id === match.winnerId);
              const brWinner = match.winnerId && match.allPlayers?.find(p => p.id === match.winnerId);

              return (
                <div key={match.id} className="p-3 rounded-md bg-muted/50 space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <p className="font-semibold">{match.game} <span className="font-normal text-muted-foreground">({match.matchType || 'N/A'})</span></p>
                    {match.date ? (
                      <div className="font-medium">{format((match.date as any).toDate ? (match.date as any).toDate() : new Date(match.date), 'PP')}</div>
                    ) : (
                      <div className="text-muted-foreground">TBD</div>
                    )}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {match.allPlayers && match.allPlayers.length > 0 ? (
                      <p className={cn("font-semibold text-sm", brWinner && "text-emerald-600")}>
                        Battle Royale ({match.allPlayers.length} players)
                        {brWinner && ` - Winner: ${brWinner.name}`}
                      </p>
                    ) : (
                      <>
                        <PlayerListDisplay players={match.player1} isWinner={p1IsWinner || undefined} />
                        <div className="font-sans font-bold text-center text-xs py-1">vs</div>
                        <PlayerListDisplay players={match.player2} isWinner={p2IsWinner || undefined} />
                      </>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        ) : (
          <div className="text-center text-muted-foreground py-8 flex items-center justify-center h-full">
            <p>{emptyText}</p>
          </div>
        )}
      </CardContent>
      {totalPages > 1 && (
        <CardFooter className="flex items-center justify-center gap-4">
          <Button variant="outline" size="sm" onClick={() => setCurrentPage(p => p - 1)} disabled={currentPage === 1}>
            <ChevronLeft className="h-4 w-4" />
            Previous
          </Button>
          <span className="text-sm text-muted-foreground">
            Page {currentPage} of {totalPages}
          </span>
          <Button variant="outline" size="sm" onClick={() => setCurrentPage(p => p + 1)} disabled={currentPage === totalPages}>
            Next
            <ChevronRight className="h-4 w-4" />
          </Button>
        </CardFooter>
      )}
    </Card>
  )
}


export default function Dashboard() {
  const [loading, setLoading] = React.useState(true);
  const [players, setPlayers] = React.useState<Player[]>([]);
  const [matches, setMatches] = React.useState<Match[]>([]);
  const [selectedBranch, setSelectedBranch] = React.useState('all');
  const [now, setNow] = React.useState<Date | null>(null);

  React.useEffect(() => {
    setLoading(true);
    const unsubPlayers = getPlayers(setPlayers);
    const unsubMatches = getMatches((matchData) => {
      setMatches(matchData);
      setLoading(false); // Set loading to false only after matches are loaded
    });

    setNow(new Date());
    // Update the current time every 30 seconds to check for live matches
    const interval = setInterval(() => setNow(new Date()), 30000);

    return () => {
      unsubPlayers();
      unsubMatches();
      clearInterval(interval);
    };
  }, []);

  const filteredPlayers = React.useMemo(() =>
    selectedBranch === 'all'
      ? players
      : players.filter(p => p.branch === selectedBranch),
    [selectedBranch, players]
  );

  const getBranchForPlayer = (player: Player) => player.branch;

  const filteredMatches = React.useMemo(() =>
    selectedBranch === 'all'
      ? matches
      : matches.filter(m =>
        m.player1.some(p => getBranchForPlayer(p) === selectedBranch) ||
        m.player2.some(p => getBranchForPlayer(p) === selectedBranch) ||
        (m.allPlayers || []).some(p => getBranchForPlayer(p) === selectedBranch)
      ),
    [selectedBranch, matches]
  );

  const totalGames = React.useMemo(() => {
    const games = new Set(filteredMatches.map(m => m.game));
    return games.size;
  }, [filteredMatches]);

  const isMatchLive = (match: Match): boolean => {
    if (!now) return false;
    if (match.status === 'ongoing') return true;

    if (!match.date || !match.startTime || !match.endTime) {
      return false;
    }

    try {
      const matchDate = (match.date as any).toDate ? (match.date as any).toDate() : new Date(match.date);

      const [startHours, startMinutes] = match.startTime.split(':').map(Number);
      const startDateTime = new Date(matchDate);
      startDateTime.setHours(startHours, startMinutes, 0, 0);

      const [endHours, endMinutes] = match.endTime.split(':').map(Number);
      const endDateTime = new Date(matchDate);
      endDateTime.setHours(endHours, endMinutes, 0, 0);

      return now >= startDateTime && now <= endDateTime;

    } catch (e) {
      console.error("Error checking live match status:", e);
      return false;
    }
  };

  const ongoingMatchesCount = React.useMemo(() => filteredMatches.filter(isMatchLive).length, [filteredMatches, now]);


  const upcomingMatches = React.useMemo(() =>
    filteredMatches
      .filter(m => m.status === 'upcoming' && m.date)
      .sort((a, b) => {
        const dateA = a.date ? ((a.date as any).toDate ? (a.date as any).toDate() : new Date(a.date)) : null;
        const dateB = b.date ? ((b.date as any).toDate ? (b.date as any).toDate() : new Date(b.date)) : null;
        if (dateA && dateB) return dateA.getTime() - dateB.getTime();
        if (dateA) return -1;
        if (dateB) return 1;
        return 0;
      }),
    [filteredMatches]
  );

  const recentMatches = React.useMemo(() =>
    filteredMatches
      .filter(m => m.status === 'finished')
      .sort((a, b) => {
        const dateA = a.date ? ((a.date as any).toDate ? (a.date as any).toDate() : new Date(a.date)) : null;
        const dateB = b.date ? ((b.date as any).toDate ? (b.date as any).toDate() : new Date(b.date)) : null;
        if (dateA && dateB) return dateB.getTime() - dateA.getTime();
        if (dateA) return 1;
        if (dateB) return -1;
        return 0;
      }),
    [filteredMatches]
  );

  const nextMatch = React.useMemo(() => {
    return upcomingMatches.length > 0 ? upcomingMatches[0] : null;
  }, [upcomingMatches]);

  const getPlayerNames = (players: Player[], placeholder?: string) => {
    if (!players || players.length === 0) return placeholder || 'TBD';
    return players.map(p => p.name).join(' & ');
  }


  if (loading) {
    return (
      <AppLayout>
        <DashboardSkeleton />
      </AppLayout>
    )
  }


  return (
    <AppLayout>
      <div className="flex-1 space-y-4 p-4 sm:p-8 pt-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <h1 className="text-3xl font-bold tracking-tight font-headline">
            Dashboard
          </h1>
          <div className="w-full sm:w-auto sm:min-w-48">
            <Select value={selectedBranch} onValueChange={setSelectedBranch}>
              <SelectTrigger>
                <SelectValue placeholder="Select a branch" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Branches</SelectItem>
                {allBranches.map(branch => (
                  <SelectItem key={branch} value={branch}>{branch}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Total Players
              </CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{filteredPlayers.length}</div>
              <p className="text-xs text-muted-foreground">
                in {selectedBranch === 'all' ? 'all branches' : selectedBranch}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Matches Played
              </CardTitle>
              <GitMerge className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{matches.filter(m => m.status === 'finished').length}</div>
              <p className="text-xs text-muted-foreground">
                {matches.filter(m => m.status !== 'finished').length} matches remaining
              </p>
            </CardContent>
          </Card>
          <Link href="/live">
            <Card className="hover:bg-muted">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Ongoing Matches</CardTitle>
                <Flame className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{ongoingMatchesCount}</div>
                <p className="text-xs text-muted-foreground">
                  Click to view live scores
                </p>
              </CardContent>
            </Card>
          </Link>
          <Link href="/matches">
            <Card className="hover:bg-muted">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Games</CardTitle>
                <Gamepad2 className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{totalGames}</div>
                <p className="text-xs text-muted-foreground">
                  in {selectedBranch === 'all' ? 'all branches' : selectedBranch}
                </p>
              </CardContent>
            </Card>
          </Link>
        </div>
        <div className="grid gap-4 lg:grid-cols-2">
          <MatchListCard
            title="Upcoming Matches"
            icon={Calendar}
            matches={upcomingMatches}
            emptyText="No upcoming matches scheduled."
          />
          <MatchListCard
            title="Recent Results"
            icon={Clock}
            matches={recentMatches}
            emptyText="No recently finished matches."
          />
        </div>
        <div>
          <PlayerTracker allPlayers={players} allMatches={matches} />
        </div>
      </div>
    </AppLayout>
  );
}
