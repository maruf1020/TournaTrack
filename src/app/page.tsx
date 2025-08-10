
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
  GitMerge,
  Users,
  Loader2,
  Calendar,
  Clock,
  Flame,
  ChevronLeft,
  ChevronRight,
  Gamepad2,
  BedDouble,
  BarChart2,
  Map as MapIcon,
  Building,
  Trophy
} from 'lucide-react';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
  } from '@/components/ui/select';
import AppLayout from '@/components/layout/AppLayout';
import { cn } from '@/lib/utils';
import type { Match, Player, Event, Room, Game } from '@/lib/types';
import { getPlayersOnce, getMatchesOnce, getEventsOnce, getRoomsForEvent, getGamesOnce } from '@/lib/services';
import { branches } from '@/lib/placeholder-data';
import { Skeleton } from '@/components/ui/skeleton';
import { format, isFuture } from 'date-fns';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis, Tooltip, PieChart, Pie, Cell, Legend } from 'recharts';

function DashboardSkeleton() {
    return (
        <div className="flex-1 space-y-4 p-4 sm:p-8 pt-6">
            <div className="flex items-center justify-between">
                <Skeleton className="h-9 w-48" />
                <Skeleton className="h-10 w-48" />
            </div>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                {[...Array(8)].map((_, i) => <Skeleton key={i} className="h-28" />)}
            </div>
            <div className="grid gap-4 lg:grid-cols-7">
              <div className="lg:col-span-5 space-y-4">
                <Skeleton className="h-[225px]" />
                <Skeleton className="h-[225px]" />
              </div>
              <div className="lg:col-span-2 space-y-4">
                 <Skeleton className="h-[225px]" />
                <Skeleton className="h-[225px]" />
              </div>
            </div>
        </div>
    )
}

const PlayerListDisplay = ({ players, isWinner }: { players: Player[], isWinner?: boolean }) => {
    return (
      <div className={cn("text-sm", isWinner && "font-bold text-emerald-600")}>
        {players.map((p, index) => (
          <div key={p.id}>
            {players.length > 1 && `${index + 1}. `}{p.name}
          </div>
        ))}
      </div>
    );
};

function MatchListCard({ title, icon: Icon, matches, emptyText, itemsPerPage = 3 }: { title: string, icon: React.ElementType, matches: Match[], emptyText: string, itemsPerPage?: number }) {
    
    const [currentPage, setCurrentPage] = React.useState(1);

    const totalPages = Math.ceil(matches.length / itemsPerPage);
    const displayedMatches = matches.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

    return (
        <Card className="flex flex-col">
            <CardHeader>
                <CardTitle className="font-headline flex items-center gap-2">
                    <Icon className="h-5 w-5" />
                    {title}
                </CardTitle>
            </CardHeader>
            <CardContent className="flex-grow space-y-3">
                {displayedMatches.length > 0 ? (
                    <div className="space-y-3">
                        {displayedMatches.map(match => {
                            const p1IsWinner = match.winnerId && match.player1.some(p => p.id === match.winnerId);
                            const p2IsWinner = match.winnerId && match.player2.some(p => p.id === match.winnerId);
                            
                            let formattedDate = null;
                            if (match.date) {
                                try {
                                    const jsDate = (match.date as any).toDate ? (match.date as any).toDate() : new Date(match.date);
                                    if (!isNaN(jsDate.getTime())) {
                                        formattedDate = format(jsDate, 'PP');
                                    }
                                } catch (e) {}
                            }
                            return (
                                <div key={match.id} className="p-3 rounded-md bg-muted/50 space-y-2">
                                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                                        <p className="font-semibold">{match.tournamentName}</p>
                                        {formattedDate ? <div className="font-medium">{formattedDate}</div> : <div>TBD</div>}
                                    </div>
                                    <div>
                                      <PlayerListDisplay players={match.player1} isWinner={p1IsWinner || undefined} />
                                      <div className="font-sans font-bold text-center text-xs py-1">vs</div>
                                      <PlayerListDisplay players={match.player2} isWinner={p2IsWinner || undefined} />
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
                        <ChevronLeft className="h-4 w-4" /> Previous
                    </Button>
                    <span className="text-sm text-muted-foreground"> {currentPage} / {totalPages} </span>
                    <Button variant="outline" size="sm" onClick={() => setCurrentPage(p => p + 1)} disabled={currentPage === totalPages}>
                        Next <ChevronRight className="h-4 w-4" />
                    </Button>
                </CardFooter>
            )}
        </Card>
    )
}

const BranchChart = ({ players }: { players: Player[] }) => {
    const data = React.useMemo(() => {
        const branchCounts: { [key: string]: number } = {};
        players.forEach(player => {
            const branch = player.branch || 'Unknown';
            branchCounts[branch] = (branchCounts[branch] || 0) + 1;
        });
        return Object.entries(branchCounts).map(([name, count]) => ({ name, count }));
    }, [players]);

    return (
        <ResponsiveContainer width="100%" height={200}>
            <BarChart data={data} layout="vertical" margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
                <XAxis type="number" hide />
                <YAxis dataKey="name" type="category" tickLine={false} axisLine={false} tick={{ fontSize: 12 }} width={80} />
                <Tooltip cursor={{ fill: 'hsl(var(--muted))' }} contentStyle={{backgroundColor: 'hsl(var(--background))'}}/>
                <Bar dataKey="count" fill="hsl(var(--primary))" radius={[0, 4, 4, 0]} />
            </BarChart>
        </ResponsiveContainer>
    );
};

const MatchStatusChart = ({ matches }: { matches: Match[] }) => {
    const data = React.useMemo(() => {
        const statusCounts: { [key: string]: number } = {
            finished: 0,
            upcoming: 0,
            ongoing: 0,
            draft: 0,
            cancelled: 0,
        };
        matches.forEach(match => {
            statusCounts[match.status] = (statusCounts[match.status] || 0) + 1;
        });
        return Object.entries(statusCounts)
          .map(([name, value]) => ({ name: name.charAt(0).toUpperCase() + name.slice(1), value }))
          .filter(item => item.value > 0);
    }, [matches]);

    const COLORS = {
        Finished: '#22c55e', // green-500
        Upcoming: '#f59e0b', // amber-500
        Ongoing: '#ef4444',  // red-500
        Draft: '#3b82f6',    // blue-500
        Cancelled: '#64748b' // slate-500
    };

    return (
        <Card>
            <CardHeader>
                <CardTitle>Match Status Overview</CardTitle>
            </CardHeader>
            <CardContent>
                <ResponsiveContainer width="100%" height={200}>
                    <PieChart>
                        <Pie data={data} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label>
                            {data.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={COLORS[entry.name as keyof typeof COLORS] || '#8884d8'} />
                            ))}
                        </Pie>
                        <Tooltip contentStyle={{backgroundColor: 'hsl(var(--background))'}}/>
                        <Legend />
                    </PieChart>
                </ResponsiveContainer>
            </CardContent>
        </Card>
    );
};

const TopPlayersChart = ({ matches, players }: { matches: Match[], players: Player[] }) => {
    const topPlayers = React.useMemo(() => {
        const playerWins: { [playerId: string]: number } = {};

        matches.forEach(match => {
            if (match.status !== 'finished' || !match.winnerId) {
                return; // Skip non-finished matches or those without a winner
            }

            let winningPlayers: Player[] = [];
            
            // Check if winner is in player1 team
            if (match.player1.some(p => p.id === match.winnerId)) {
                winningPlayers = match.player1;
            } 
            // Check if winner is in player2 team
            else if (match.player2.some(p => p.id === match.winnerId)) {
                winningPlayers = match.player2;
            } 
            // Check for Battle Royale winner
            else if (match.allPlayers) {
                const winner = match.allPlayers.find(p => p.id === match.winnerId);
                if (winner) {
                    winningPlayers = [winner];
                }
            }

            // Increment win count for each player on the winning team
            winningPlayers.forEach(player => {
                playerWins[player.id] = (playerWins[player.id] || 0) + 1;
            });
        });

        return Object.entries(playerWins)
            .map(([playerId, wins]) => {
                const player = players.find(p => p.id === playerId);
                return { name: player ? player.name.split(' ')[0] : 'Unknown', fullName: player ? player.name : 'Unknown', wins };
            })
            .filter(p => p.wins > 0) // Only include players with wins
            .sort((a, b) => b.wins - a.wins)
            .slice(0, 10); // Top 10 players
    }, [matches, players]);
    
    // Custom tooltip to show full name
    const CustomTooltip = ({ active, payload, label }: any) => {
        if (active && payload && payload.length) {
            return (
            <div className="p-2 border rounded-md bg-background shadow-lg">
                <p className="font-semibold">{payload[0].payload.fullName}</p>
                <p className="text-sm text-muted-foreground">{`Wins: ${payload[0].value}`}</p>
            </div>
            );
        }
        return null;
    };

    return (
        <Card>
            <CardHeader>
                <CardTitle>Top Players by Wins</CardTitle>
            </CardHeader>
            <CardContent>
                 <ResponsiveContainer width="100%" height={200}>
                    <BarChart data={topPlayers} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
                        <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                        <YAxis allowDecimals={false} />
                        <Tooltip cursor={{ fill: 'hsl(var(--muted))' }} content={<CustomTooltip />} />
                        <Bar dataKey="wins" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                    </BarChart>
                </ResponsiveContainer>
            </CardContent>
        </Card>
    );
};


export default function HomePage() {
  const [loading, setLoading] = React.useState(true);
  const [players, setPlayers] = React.useState<Player[]>([]);
  const [matches, setMatches] = React.useState<Match[]>([]);
  const [events, setEvents] = React.useState<Event[]>([]);
  const [rooms, setRooms] = React.useState<Room[]>([]);
  const [games, setGames] = React.useState<Game[]>([]);
  const [selectedEventId, setSelectedEventId] = React.useState<string | null>(null);
  const [now, setNow] = React.useState<Date | null>(null);

  React.useEffect(() => {
    async function loadData() {
        setLoading(true);
        try {
            const [playerData, matchData, eventData, gameData] = await Promise.all([
                getPlayersOnce(),
                getMatchesOnce(),
                getEventsOnce(),
                getGamesOnce(),
            ]);
            setPlayers(playerData);
            setMatches(matchData);
            setGames(gameData);
            const sortedEvents = eventData.sort((a,b) => b.startTime.getTime() - a.startTime.getTime());
            setEvents(sortedEvents);
            if (sortedEvents.length > 0) {
              setSelectedEventId(sortedEvents[0].id);
            }
        } catch (error) {
            console.error("Failed to load dashboard data:", error);
        } finally {
            setLoading(false);
        }
    }

    loadData();
    setNow(new Date());
    const interval = setInterval(() => setNow(new Date()), 30000);
    return () => clearInterval(interval);
  }, []);

  React.useEffect(() => {
    if (!selectedEventId) return;
    async function loadRooms() {
        const roomData = await getRoomsForEvent(selectedEventId);
        setRooms(roomData);
    }
    loadRooms();
  }, [selectedEventId]);

  const stats = React.useMemo(() => {
    const isMatchLive = (match: Match): boolean => {
      if (!now) return false;
      if (match.status === 'ongoing') return true;
      if (!match.date || !match.startTime || !match.endTime) return false;
      try {
          const matchDate = (match.date as any).toDate ? (match.date as any).toDate() : new Date(match.date);
          const [startHours, startMinutes] = match.startTime.split(':').map(Number);
          const startDateTime = new Date(matchDate);
          startDateTime.setHours(startHours, startMinutes, 0, 0);
          const [endHours, endMinutes] = match.endTime.split(':').map(Number);
          const endDateTime = new Date(matchDate);
          endDateTime.setHours(endHours, endMinutes, 0, 0);
          return now >= startDateTime && now <= endDateTime;
      } catch(e) { return false; }
    };

    return {
      totalPlayers: players.length,
      matchesPlayed: matches.filter(m => m.status === 'finished').length,
      ongoingMatchesCount: matches.filter(isMatchLive).length,
      totalRooms: rooms.length,
      totalEvents: events.length,
      totalBranches: branches.length,
      totalGames: games.length,
    };
  }, [players, matches, rooms, now, events, games]);
  
  const upcomingMatches = React.useMemo(() =>
    matches.filter(m => m.status === 'upcoming' && m.date)
      .sort((a, b) => ((a.date as any).toDate() || new Date(a.date)).getTime() - ((b.date as any).toDate() || new Date(b.date)).getTime()),
    [matches]
  );
  
  const recentMatches = React.useMemo(() =>
    matches.filter(m => m.status === 'finished')
      .sort((a,b) => ((b.date as any).toDate() || new Date(b.date)).getTime() - ((a.date as any).toDate() || new Date(a.date)).getTime()),
    [matches]
  );

  const selectedEvent = events.find(e => e.id === selectedEventId);
  const upcomingEvents = React.useMemo(() => events.filter(e => isFuture(e.startTime)).sort((a,b) => a.startTime.getTime() - b.startTime.getTime()), [events]);

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
          <h1 className="text-3xl font-bold tracking-tight font-headline">Dashboard</h1>
          <div className="w-full sm:w-auto sm:min-w-64">
             <Select value={selectedEventId || ''} onValueChange={setSelectedEventId} disabled={events.length === 0}>
                <SelectTrigger>
                    <SelectValue placeholder="Select an event to view details..." />
                </SelectTrigger>
                <SelectContent>
                    {events.map(event => (
                        <SelectItem key={event.id} value={event.id}>{event.name}</SelectItem>
                    ))}
                </SelectContent>
            </Select>
          </div>
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Total Employees</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalPlayers}</div>
              <p className="text-xs text-muted-foreground">Company-wide employee count</p>
            </CardContent>
          </Card>
           <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Matches Played</CardTitle>
              <GitMerge className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.matchesPlayed}</div>
               <p className="text-xs text-muted-foreground">Across all tournaments</p>
            </CardContent>
          </Card>
           <Link href="/live">
            <Card className="hover:bg-muted">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Live Matches</CardTitle>
                <Flame className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                <div className="text-2xl font-bold">{stats.ongoingMatchesCount}</div>
                <p className="text-xs text-muted-foreground">Click to view live scores</p>
                </CardContent>
            </Card>
          </Link>
           <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Total Rooms</CardTitle>
              <BedDouble className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalRooms}</div>
              <p className="text-xs text-muted-foreground">in {selectedEvent?.name || 'selected event'}</p>
            </CardContent>
          </Card>
           <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Total Events</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalEvents}</div>
              <p className="text-xs text-muted-foreground">Past and upcoming events</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Total Branches</CardTitle>
              <Building className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalBranches}</div>
              <p className="text-xs text-muted-foreground">Company-wide office locations</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Total Games</CardTitle>
              <Gamepad2 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalGames}</div>
              <p className="text-xs text-muted-foreground">Available for tournaments</p>
            </CardContent>
          </Card>
           <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Total Tournaments</CardTitle>
              <Trophy className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{new Set(matches.map(m=>m.tournamentName)).size}</div>
              <p className="text-xs text-muted-foreground">Created in the system</p>
            </CardContent>
          </Card>
        </div>
        
        <div className="grid gap-4 grid-cols-1 lg:grid-cols-2">
          <MatchStatusChart matches={matches} />
          <TopPlayersChart matches={matches} players={players} />
        </div>

        <div className="grid gap-4 lg:grid-cols-2">
          <div className="space-y-4">
             <MatchListCard title="Upcoming Matches" icon={Clock} matches={upcomingMatches} emptyText="No upcoming matches." />
             <MatchListCard title="Recent Results" icon={GitMerge} matches={recentMatches} emptyText="No finished matches." />
          </div>
          <div className="space-y-4">
            {selectedEvent && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg font-headline">{selectedEvent.name}</CardTitle>
                  <CardDescription>{format(selectedEvent.startTime, 'PPP')} - {format(selectedEvent.endTime, 'PPP')}</CardDescription>
                </CardHeader>
                <CardContent>
                    <h4 className="text-sm font-semibold mb-2">Player Distribution</h4>
                    <BranchChart players={players}/>
                </CardContent>
                <CardFooter>
                    <Button asChild className="w-full">
                        <Link href={`/events/map`}><MapIcon className="mr-2 h-4 w-4" /> View Full Timeline</Link>
                    </Button>
                </CardFooter>
              </Card>
            )}
            <Card>
                <CardHeader>
                    <CardTitle className="text-lg font-headline">Upcoming Events</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                    {upcomingEvents.length > 0 ? upcomingEvents.slice(0, 5).map(event => (
                        <div key={event.id} className="p-3 bg-muted/50 rounded-md">
                            <p className="font-semibold">{event.name}</p>
                            <p className="text-sm text-muted-foreground">{format(event.startTime, 'PPP')}</p>
                        </div>
                    )) : (
                        <p className="text-sm text-muted-foreground text-center py-4">No upcoming events scheduled.</p>
                    )}
                </CardContent>
                 {upcomingEvents.length > 0 && (
                    <CardFooter>
                        <Button asChild variant="outline" className="w-full">
                            <Link href="/events/map">View All Events</Link>
                        </Button>
                    </CardFooter>
                )}
            </Card>
            {!selectedEvent && (
              <Card className="h-full flex items-center justify-center">
                  <p className="text-muted-foreground">Select an event to view details.</p>
              </Card>
            )}
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
