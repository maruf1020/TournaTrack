
'use client';
import * as React from 'react';
import {
  Card,
  CardContent,
} from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import AppLayout from '@/components/layout/AppLayout';
import { Gamepad2, Filter, Loader2 } from 'lucide-react';
import { branches, departments } from '@/lib/placeholder-data';
import { getMatches } from '@/lib/services';
import type { Match, Player } from '@/lib/types';
import { StatusBadge } from '@/components/ui/status-badge';

const PlayerAvatar = ({ player }: { player: Player }) => (
    <div className="flex flex-col items-center gap-2">
        <Avatar>
          <AvatarImage src={player.imageUrl} alt={player.name} data-ai-hint="profile person" />
          <AvatarFallback>{player.name.charAt(0)}</AvatarFallback>
        </Avatar>
        <span className="font-medium text-sm truncate w-full">{player.name}</span>
    </div>
)

const MatchCard = ({ match }: { match: Match }) => {
  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex justify-between items-center mb-3">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Gamepad2 className="w-4 h-4" />
            <span>{match.tournamentName}</span>
          </div>
          <StatusBadge status={match.status} className="animate-pulse" />
        </div>

        <div className="grid grid-cols-3 items-center gap-2 text-center">
          <div className="flex flex-col items-center gap-2">
            {match.player1.map(p => <PlayerAvatar key={p.id} player={p} />)}
          </div>

          <div className="font-bold text-2xl text-primary">
            <span>{match.score.player1}</span> - <span>{match.score.player2}</span>
            <div className="text-sm font-light text-muted-foreground">vs</div>
          </div>

          <div className="flex flex-col items-center gap-2">
            {match.player2.map(p => <PlayerAvatar key={p.id} player={p} />)}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};


export default function LiveDashboardPage() {
  const [matches, setMatches] = React.useState<Match[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [now, setNow] = React.useState<Date | null>(null);

   const [filters, setFilters] = React.useState({
    search: '',
    branch: 'all',
    department: 'all',
    game: 'all',
    matchType: 'all',
  });

   React.useEffect(() => {
    setLoading(true);
    const unsub = getMatches((matchData) => {
        setMatches(matchData);
        setLoading(false);
    });

    setNow(new Date());
     // Update the current time every 30 seconds to check for live matches
    const interval = setInterval(() => setNow(new Date()), 30000);

    return () => {
      unsub();
      clearInterval(interval);
    }
  }, []);
  
  const handleFilterChange = (key: keyof typeof filters, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };
  
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

    } catch(e) {
        console.error("Error checking live match status:", e);
        return false;
    }
  };

  const filteredMatches = React.useMemo(() => {
    const liveMatches = matches.filter(isMatchLive);

    return liveMatches.filter(match => {
        const searchLower = filters.search.toLowerCase();
        const allPlayers = [...(match.allPlayers || []), ...match.player1, ...match.player2].filter(p => p.name);
        const nameMatch = filters.search ? 
            allPlayers.some(p => p.name.toLowerCase().includes(searchLower)) ||
            (match.player1Placeholder && match.player1Placeholder.toLowerCase().includes(searchLower)) ||
            (match.player2Placeholder && match.player2Placeholder.toLowerCase().includes(searchLower))
            : true;
        
        const branchMatch = filters.branch === 'all' ? true : 
            allPlayers.some(p => p.branch === filters.branch);
            
        const departmentMatch = filters.department === 'all' ? true :
            allPlayers.some(p => p.department === filters.department);

        const gameMatch = filters.game === 'all' ? true : match.game === filters.game;

        const matchTypeMatch = filters.matchType === 'all' ? true : match.matchType === filters.matchType;

        return nameMatch && branchMatch && departmentMatch && gameMatch && matchTypeMatch;
    });
  }, [matches, filters, now]);


  const allGames = React.useMemo(() => {
    const gamesSet = new Set<string>();
    matches.forEach(m => m.game && gamesSet.add(m.game));
    return Array.from(gamesSet).sort();
  }, [matches]);

   const allMatchTypes = React.useMemo(() => {
    const matchTypes = new Set<string>();
    matches.forEach(m => m.matchType && matchTypes.add(m.matchType));
    return Array.from(matchTypes).sort();
  }, [matches]);


  if (loading) {
    return (
       <AppLayout>
        <div className="flex-1 flex items-center justify-center">
          <div className="flex items-center gap-2 text-muted-foreground">
            <Loader2 className="h-6 w-6 animate-spin" />
            <span>Loading Live Matches...</span>
          </div>
        </div>
      </AppLayout>
    )
  }
  
  return (
    <AppLayout>
      <div className="flex-1 space-y-4 p-4 sm:p-8 pt-6">
        <h1 className="text-3xl font-bold tracking-tight font-headline">Live Scores</h1>
        
        <Card>
            <CardContent className="p-4">
               <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
                  <div className="lg:col-span-1">
                      <Input 
                          placeholder="Search player or match..."
                          value={filters.search}
                          onChange={e => handleFilterChange('search', e.target.value)}
                      />
                  </div>
                  <Select value={filters.game} onValueChange={value => handleFilterChange('game', value)}>
                      <SelectTrigger><SelectValue placeholder="All Games" /></SelectTrigger>
                      <SelectContent>
                          <SelectItem value="all">All Games</SelectItem>
                          {allGames.map(g => <SelectItem key={g} value={g}>{g}</SelectItem>)}
                      </SelectContent>
                  </Select>
                  <Select value={filters.matchType} onValueChange={value => handleFilterChange('matchType', value)}>
                      <SelectTrigger><SelectValue placeholder="All Types" /></SelectTrigger>
                      <SelectContent>
                          <SelectItem value="all">All Match Types</SelectItem>
                          {allMatchTypes.map(mt => <SelectItem key={mt} value={mt}>{mt}</SelectItem>)}
                      </SelectContent>
                  </Select>
                  <Select value={filters.branch} onValueChange={value => handleFilterChange('branch', value)}>
                      <SelectTrigger><SelectValue placeholder="All Branches" /></SelectTrigger>
                      <SelectContent>
                          <SelectItem value="all">All Branches</SelectItem>
                          {branches.map(b => <SelectItem key={b} value={b}>{b}</SelectItem>)}
                      </SelectContent>
                  </Select>
                  <Select value={filters.department} onValueChange={value => handleFilterChange('department', value)}>
                      <SelectTrigger><SelectValue placeholder="All Departments"/></SelectTrigger>
                      <SelectContent>
                          <SelectItem value="all">All Departments</SelectItem>
                          {departments.map(d => <SelectItem key={d} value={d}>{d}</SelectItem>)}
                      </SelectContent>
                  </Select>
              </div>
            </CardContent>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {filteredMatches.map(match => (
            <MatchCard key={match.id} match={match} />
          ))}
        </div>
         {filteredMatches.length === 0 && (
            <div className="text-center py-16 text-muted-foreground">
                <p>No live matches right now for the selected filters.</p>
                <p>Check back later or adjust your filters!</p>
            </div>
         )}
      </div>
    </AppLayout>
  );
}
