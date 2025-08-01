
'use client';

import * as React from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Trophy, Loader2, Filter, Calendar as CalendarIcon, Pencil, Trash2, Download } from 'lucide-react';
import type { Match, Player, Game, PublicSettings } from '@/lib/types';
import { getMatches, updateMatch, getPublicSettings } from '@/lib/services';
import { useToast } from '@/hooks/use-toast';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { branches, departments } from '@/lib/placeholder-data';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { Checkbox } from '../ui/checkbox';
import { StatusBadge } from '@/components/ui/status-badge';
import { useAuth } from '@/hooks/use-auth';


function EditMatchDialog({ match, onUpdate, open, onOpenChange }: { match: Match | null, onUpdate: (match: Match) => void, open: boolean, onOpenChange: (open: boolean) => void }) {
    const [date, setDate] = React.useState<Date | undefined>();
    const [startTime, setStartTime] = React.useState<string>("");
    const [endTime, setEndTime] = React.useState<string>("");
    const [status, setStatus] = React.useState<Match['status']>('upcoming');
    const [score1, setScore1] = React.useState(0);
    const [score2, setScore2] = React.useState(0);
    const [isDatePublished, setIsDatePublished] = React.useState(false);
    const [winnerId, setWinnerId] = React.useState<string | null>(null);
    const { toast } = useToast();

    React.useEffect(() => {
        if (match) {
            // Firestore timestamps need to be converted to JS Date objects
            if (match.date) {
                const jsDate = (match.date as any).toDate ? (match.date as any).toDate() : new Date(match.date);
                setDate(jsDate);
            } else {
                setDate(undefined);
            }
            setStartTime(match.startTime || "");
            setEndTime(match.endTime || "");
            setStatus(match.status || 'draft');
            setScore1(match.score?.player1 || 0);
            setScore2(match.score?.player2 || 0);
            setIsDatePublished(match.isDatePublished || false);
            setWinnerId(match.winnerId || null);
        }
    }, [match]);

    if (!match) return null;

    const handleSave = async () => {
        const updatedMatchData: Partial<Match> = {
            date: date || null,
            startTime,
            endTime,
            score: { player1: score1, player2: score2 },
            isDatePublished: isDatePublished,
            winnerId: winnerId,
            status: status
        };
        
        if (winnerId) {
            updatedMatchData.status = 'finished';
        }

        try {
            await updateMatch(match.id, updatedMatchData);
            onUpdate({ ...match, ...updatedMatchData, id: match.id }); 
            toast({ title: 'Match Updated', description: 'The match details have been saved.' });
            onOpenChange(false);
        } catch (error: any) {
            toast({ title: 'Update Failed', description: error.message, variant: 'destructive'});
        }
    };
    
    const allPlayersInMatch = [...(match.allPlayers || []), ...match.player1, ...match.player2].filter(p => p.id);

    const getPlayerNames = (players: Player[], placeholder?: string) => {
      if (placeholder && (!players || players.length === 0)) return placeholder;
      return players.map(p => p.name).join(' & ');
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Edit Match</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 py-4">
                     <div className="space-y-2">
                        <Label>Status</Label>
                        <Select value={status} onValueChange={(value) => setStatus(value as Match['status'])}>
                            <SelectTrigger>
                                <SelectValue placeholder="Select status" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="draft">Draft</SelectItem>
                                <SelectItem value="upcoming">Upcoming</SelectItem>
                                <SelectItem value="ongoing">Ongoing</SelectItem>
                                <SelectItem value="finished">Finished</SelectItem>
                                <SelectItem value="cancelled">Cancelled</SelectItem>
                            </SelectContent>
                        </Select>
                     </div>
                     <div className="space-y-2">
                        <Label>Match Date</Label>
                        <Popover>
                            <PopoverTrigger asChild>
                                <Button
                                variant={"outline"}
                                className={cn(
                                    "w-full justify-start text-left font-normal",
                                    !date && "text-muted-foreground"
                                )}
                                >
                                <CalendarIcon className="mr-2 h-4 w-4" />
                                {date ? format(date, "PPP") : <span>Pick a date</span>}
                                </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0">
                                <Calendar mode="single" selected={date} onSelect={setDate} initialFocus/>
                            </PopoverContent>
                        </Popover>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label>Start Time</Label>
                            <Input type="time" value={startTime} onChange={e => setStartTime(e.target.value)} />
                        </div>
                        <div className="space-y-2">
                            <Label>End Time</Label>
                            <Input type="time" value={endTime} onChange={e => setEndTime(e.target.value)} />
                        </div>
                    </div>
                     <div className="flex items-center space-x-2">
                        <Checkbox id="isDatePublished" checked={isDatePublished} onCheckedChange={(checked) => setIsDatePublished(!!checked)} />
                        <label htmlFor="isDatePublished" className="text-sm font-medium leading-none">
                            Publish Date
                        </label>
                    </div>
                    {match.allPlayers && match.allPlayers.length > 0 ? (
                         <div className="space-y-2">
                            <Label>Winner</Label>
                            <Select onValueChange={(value) => setWinnerId(value === 'none' ? null : value)} defaultValue={winnerId || 'none'}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Select a winner" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="none">None</SelectItem>
                                    {allPlayersInMatch.map(p => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}
                                </SelectContent>
                            </Select>
                         </div>
                    ) : (
                       <>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label>Score: {getPlayerNames(match.player1, match.player1Placeholder)}</Label>
                                <Input type="number" value={score1} onChange={(e) => setScore1(Number(e.target.value))} />
                            </div>
                            <div className="space-y-2">
                                <Label>Score: {getPlayerNames(match.player2, match.player2Placeholder)}</Label>
                                <Input type="number" value={score2} onChange={(e) => setScore2(Number(e.target.value))} />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <Label>Winner</Label>
                             <Select onValueChange={(value) => setWinnerId(value === 'none' ? null : value)} defaultValue={winnerId || 'none'}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Select a winner" />
                                </SelectTrigger>
                                <SelectContent>
                                     <SelectItem value="none">None</SelectItem>
                                     {match.player1.length > 0 && <SelectItem value={match.player1[0].id}>{getPlayerNames(match.player1)}</SelectItem>}
                                     {match.player2.length > 0 && <SelectItem value={match.player2[0].id}>{getPlayerNames(match.player2)}</SelectItem>}
                                </SelectContent>
                            </Select>
                        </div>
                       </>
                    )}
                </div>
                <DialogFooter>
                    <DialogClose asChild><Button variant="outline">Cancel</Button></DialogClose>
                    <Button onClick={handleSave}>Save Changes</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}

const PlayerListDisplay = ({ players, placeholder }: { players: Player[], placeholder?: string }) => {
    if ((!players || players.length === 0) && placeholder) {
      return <div className="italic text-muted-foreground">{placeholder}</div>;
    }
    if (!players || players.length === 0) return <div className="italic text-muted-foreground">TBD</div>;
    
    return (
      <div className="flex flex-col">
        {players.map((p, index) => (
          <div key={p.id}>
            {players.length > 1 && `${index + 1}. `}{p.name}
          </div>
        ))}
      </div>
    );
};

const WinnerDisplay = ({ players }: { players: Player[] | undefined }) => {
    if (!players || players.length === 0) return <>TBD</>;
    return (
      <div className="flex flex-col">
        {players.map((p, index) => (
          <div key={p.id}>
            {players.length > 1 && `${index + 1}. `}{p.name}
          </div>
        ))}
      </div>
    );
};


export function MatchList({ isAdmin = false, onFilteredMatchesChange }: { isAdmin?: boolean, onFilteredMatchesChange?: (matches: Match[]) => void }) {
  const [matchList, setMatchList] = React.useState<Match[]>([]);
  const [publicSettings, setPublicSettings] = React.useState<PublicSettings | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [editingMatch, setEditingMatch] = React.useState<Match | null>(null);
  const { user, isAdmin: authIsAdmin, loading: authLoading } = useAuth();

  const [filters, setFilters] = React.useState({
    search: '',
    branch: 'all',
    department: 'all',
    game: 'all',
    matchType: 'all',
    status: 'all',
  });

  React.useEffect(() => {
    setLoading(true);
    const unsubMatches = getMatches((matches) => {
        const sortedMatches = matches.sort((a, b) => {
            const dateA = a.date ? (a.date as any).toDate ? (a.date as any).toDate() : new Date(a.date) : null;
            const dateB = b.date ? (b.date as any).toDate ? (b.date as any).toDate() : new Date(b.date) : null;
            if (dateA && dateB) return dateB.getTime() - dateA.getTime();
            if (dateA) return -1;
            if (dateB) return 1;
            return 0;
        });
        setMatchList(sortedMatches);
        setLoading(false);
    });
    
    if (!isAdmin) {
        const unsubSettings = getPublicSettings(setPublicSettings);
        return () => {
            unsubMatches();
            unsubSettings();
        }
    }

    return () => unsubMatches();
  }, [isAdmin]);


  const handleFilterChange = (key: keyof typeof filters, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const filteredMatches = React.useMemo(() => {
    let matches = matchList;

    if (!isAdmin && publicSettings) {
        matches = matches.filter(m => publicSettings.visibleStatuses[m.status] ?? true);
    }
    
    return matches.filter(match => {
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
        
        const statusMatch = filters.status === 'all' ? true : match.status === filters.status;

        return nameMatch && branchMatch && departmentMatch && gameMatch && matchTypeMatch && statusMatch;
    });
  }, [matchList, filters, isAdmin, publicSettings]);
  
  React.useEffect(() => {
    if(onFilteredMatchesChange) {
      onFilteredMatchesChange(filteredMatches);
    }
  }, [filteredMatches, onFilteredMatchesChange]);

  const allGames = React.useMemo(() => {
    const games = new Set<string>();
    matchList.forEach(m => {
        m.game && games.add(m.game);
    });
    return Array.from(games).sort();
  }, [matchList]);

   const allMatchTypes = React.useMemo(() => {
    const matchTypes = new Set<string>();
    matchList.forEach(m => {
        m.matchType && matchTypes.add(m.matchType);
    });
    return Array.from(matchTypes).sort();
  }, [matchList]);

  const allStatuses = React.useMemo(() => {
    const statuses = new Set<Match['status']>();
    matchList.forEach(m => {
        m.status && statuses.add(m.status);
    });
    return Array.from(statuses).sort();
  }, [matchList]);


  const getWinnerForMatch = (match: Match): Player[] | undefined => {
    if (!match.winnerId) return undefined;

    if (match.player1.some(p => p.id === match.winnerId)) {
        return match.player1;
    } 
    if (match.player2.some(p => p.id === match.winnerId)) {
        return match.player2;
    }
    if (match.allPlayers) {
        const winner = match.allPlayers.find(p => p.id === match.winnerId);
        return winner ? [winner] : undefined;
    }
    return undefined;
};

  
  if (loading || authLoading) {
    return (
        <div className="flex items-center justify-center p-8">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <span className="ml-2">Loading Matches...</span>
        </div>
    )
  }


  return (
    <div className="space-y-4">
        <div className="p-4 border rounded-lg bg-card space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
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
                <Select value={filters.status} onValueChange={value => handleFilterChange('status', value)}>
                    <SelectTrigger><SelectValue placeholder="All Statuses"/></SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">All Statuses</SelectItem>
                        {allStatuses.map(s => <SelectItem key={s} value={s} className="capitalize">{s}</SelectItem>)}
                    </SelectContent>
                </Select>
            </div>
        </div>
        <div className="rounded-md border">
        <div className="overflow-x-auto">
        <Table>
            <TableHeader className="bg-muted/50">
              <TableRow>
                <TableHead>Tournament Name</TableHead>
                <TableHead>Match Name</TableHead>
                <TableHead>Players</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Winner</TableHead>
                {isAdmin && <TableHead className="text-right">Actions</TableHead>}
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredMatches.length > 0 ? filteredMatches.map((match) => (
                <TableRow key={match.id} className="odd:bg-muted/10">
                  <TableCell className="font-medium whitespace-nowrap">{match.game} <span className="text-muted-foreground text-xs">({match.matchType})</span></TableCell>
                  <TableCell className="whitespace-nowrap">{match.matchName}</TableCell>
                  <TableCell>
                   {match.allPlayers && match.allPlayers.length > 0 ? `Battle Royale (${match.allPlayers.length} players)` : (
                    <div className="flex items-center gap-2">
                        <PlayerListDisplay players={match.player1} placeholder={match.player1Placeholder} />
                        <div className="font-sans font-bold text-xs mx-1">vs</div>
                        <PlayerListDisplay players={match.player2} placeholder={match.player2Placeholder} />
                    </div>
                   )}
                  </TableCell>
                  <TableCell>
                    {match.date && match.isDatePublished ? format((match.date as any).toDate ? (match.date as any).toDate() : new Date(match.date), 'PP') : <span className="text-muted-foreground">TBD</span>}
                  </TableCell>
                  <TableCell>
                    <StatusBadge status={match.status} />
                  </TableCell>
                  <TableCell className="whitespace-nowrap">
                    <WinnerDisplay players={getWinnerForMatch(match)} />
                  </TableCell>
                  {isAdmin && (
                    <TableCell className="text-right">
                      <Button variant="ghost" size="icon" onClick={() => setEditingMatch(match)}>
                          <Pencil className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive hidden">
                          <Trash2 className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  )}
                </TableRow>
              )) : (
                <TableRow>
                  <TableCell colSpan={isAdmin ? 7 : 6} className="h-24 text-center">
                    No matches found for the current filters.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
        </div>
        {isAdmin && (
          <EditMatchDialog 
              match={editingMatch}
              open={!!editingMatch}
              onOpenChange={(open) => !open && setEditingMatch(null)}
              onUpdate={(updatedMatch) => {
                  // The onSnapshot listener will handle the update automatically.
                  setEditingMatch(null);
              }}
          />
        )}
    </div>
  );
}

    