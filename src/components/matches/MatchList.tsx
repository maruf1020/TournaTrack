

'use client';

import * as React from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableRow,
  TableHead,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Trophy, Loader2, Filter, Calendar as CalendarIcon, Pencil, Trash2, Download, Users } from 'lucide-react';
import type { Match, Player, Game, PublicSettings } from '@/lib/types';
import { getMatchesOnce, updateMatch, getPublicSettings, getGamesOnce, getPlayersOnce } from '@/lib/services';
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
import { useSortableTable } from '@/hooks/use-sortable-table';
import { SortableTableHeader } from '@/components/ui/sortable-table-header';
import { Skeleton } from '@/components/ui/skeleton';
import PlayerSelectionDialog from '@/app/admin/rooms/PlayerSelectionDialog'; // Reusing this dialog


function EditMatchDialog({ match, onUpdate, open, onOpenChange, allPlayers }: { 
    match: Match | null, 
    onUpdate: (match: Match) => void, 
    open: boolean, 
    onOpenChange: (open: boolean) => void,
    allPlayers: Player[]
}) {
    const [isSaving, setIsSaving] = React.useState(false);
    const [editedMatch, setEditedMatch] = React.useState<Match | null>(null);
    const [playerPickerState, setPlayerPickerState] = React.useState<{ open: boolean; target: 'p1' | 'p2' | 'br'; teamIndex: number; } | null>(null);
    const { toast } = useToast();

    React.useEffect(() => {
        if (match) {
            // Firestore timestamps need to be converted to JS Date objects
            const jsDate = match.date ? ((match.date as any).toDate ? (match.date as any).toDate() : new Date(match.date)) : undefined;
            setEditedMatch({ ...match, date: jsDate });
        } else {
            setEditedMatch(null);
        }
    }, [match]);

    const handleValueChange = (field: keyof Match | `score.${'player1'|'player2'}`, value: any) => {
        setEditedMatch(prev => {
            if (!prev) return null;
            if (field.startsWith('score.')) {
                const scoreField = field.split('.')[1] as 'player1' | 'player2';
                return { ...prev, score: { ...prev.score, [scoreField]: Number(value) } };
            }
            return { ...prev, [field]: value };
        });
    };

    const handleSave = async () => {
        if (!editedMatch) return;
        setIsSaving(true);
        
        let winnerId = editedMatch.winnerId;
        // If status is changed to finished, determine winner from score
        if (editedMatch.status === 'finished' && !winnerId && editedMatch.score.player1 !== editedMatch.score.player2) {
             if (editedMatch.score.player1 > editedMatch.score.player2 && editedMatch.player1.length > 0) {
                winnerId = editedMatch.player1[0].id;
             } else if (editedMatch.score.player2 > editedMatch.score.player1 && editedMatch.player2.length > 0) {
                 winnerId = editedMatch.player2[0].id;
             }
        }
        
        const finalMatchData = { 
            ...editedMatch, 
            winnerId,
            date: editedMatch.date || null // Ensure date is null instead of undefined
        };

        try {
            await updateMatch(editedMatch.id, finalMatchData);
            onUpdate(finalMatchData); 
            toast({ title: 'Match Updated', description: 'The match details have been saved.' });
            onOpenChange(false);
        } catch (error: any) {
            toast({ title: 'Update Failed', description: error.message, variant: 'destructive'});
        } finally {
            setIsSaving(false);
        }
    };
    
    if (!editedMatch) return null;

    const openPlayerPicker = (target: 'p1' | 'p2' | 'br', teamIndex: number = 0) => {
        setPlayerPickerState({ open: true, target, teamIndex });
    };

    const handlePlayerSelection = (selected: Player[]) => {
        if (!playerPickerState || selected.length === 0) return;
        
        const newPlayer = selected[0]; // We are swapping one player at a time.
        
        setEditedMatch(prev => {
            if (!prev) return null;
            const newMatch = { ...prev };
            
            if (playerPickerState.target === 'p1') {
                newMatch.player1[playerPickerState.teamIndex] = newPlayer;
            } else if (playerPickerState.target === 'p2') {
                newMatch.player2[playerPickerState.teamIndex] = newPlayer;
            } else if (playerPickerState.target === 'br' && newMatch.allPlayers) {
                newMatch.allPlayers[playerPickerState.teamIndex] = newPlayer;
            }

            return newMatch;
        });
    };

    const getPlayerNames = (players: Player[], placeholder?: string) => {
      if (placeholder && (!players || players.length === 0)) return placeholder;
      if (!players || players.length === 0) return "TBD";
      return players.map(p => p.name).join(' & ');
    }
    
    const allPlayersInMatch = [...(editedMatch.allPlayers || []), ...editedMatch.player1, ...editedMatch.player2].filter(p => p.id);

    return (
        <>
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-2xl">
                <DialogHeader>
                    <DialogTitle>Edit Match: {editedMatch.matchName}</DialogTitle>
                </DialogHeader>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 py-4">
                    {/* Column 1: Players & Winner */}
                    <div className="space-y-4">
                        <h4 className="font-semibold text-lg border-b pb-2">Participants & Winner</h4>
                        {editedMatch.allPlayers && editedMatch.allPlayers.length > 0 ? (
                            <div className="space-y-2">
                                <Label>Battle Royale Players ({editedMatch.allPlayers.length})</Label>
                                <div className="p-2 border rounded-md max-h-40 overflow-y-auto">
                                    {editedMatch.allPlayers.map((p, index) => (
                                        <div key={p.id} className="flex items-center justify-between text-sm py-1">
                                            <span>{p.name}</span>
                                            <Button variant="ghost" size="sm" onClick={() => openPlayerPicker('br', index)}>Edit</Button>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ) : (
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label>Team 1</Label>
                                    <div className="p-2 border rounded-md min-h-[60px]">
                                        {editedMatch.player1.map((p, index) => (
                                            <div key={p.id} className="flex items-center justify-between text-sm py-1">
                                                <span>{p.name}</span>
                                                <Button variant="ghost" size="sm" onClick={() => openPlayerPicker('p1', index)}>Edit</Button>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <Label>Team 2</Label>
                                    <div className="p-2 border rounded-md min-h-[60px]">
                                        {editedMatch.player2.map((p, index) => (
                                            <div key={p.id} className="flex items-center justify-between text-sm py-1">
                                                <span>{p.name}</span>
                                                <Button variant="ghost" size="sm" onClick={() => openPlayerPicker('p2', index)}>Edit</Button>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        )}
                        <div className="space-y-2">
                            <Label>Winner</Label>
                             <Select onValueChange={(value) => handleValueChange('winnerId', value === 'none' ? null : value)} value={editedMatch.winnerId || 'none'}>
                                <SelectTrigger><SelectValue placeholder="Select a winner" /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="none">None</SelectItem>
                                    {editedMatch.allPlayers && editedMatch.allPlayers.length > 0 ? (
                                        allPlayersInMatch.map(p => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)
                                    ) : (
                                        <>
                                         {editedMatch.player1.length > 0 && <SelectItem value={editedMatch.player1[0].id}>{getPlayerNames(editedMatch.player1)}</SelectItem>}
                                         {editedMatch.player2.length > 0 && <SelectItem value={editedMatch.player2[0].id}>{getPlayerNames(editedMatch.player2)}</SelectItem>}
                                        </>
                                    )}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                    {/* Column 2: Details & Score */}
                    <div className="space-y-4">
                         <h4 className="font-semibold text-lg border-b pb-2">Details & Score</h4>
                         <div className="space-y-2">
                            <Label>Status</Label>
                            <Select value={editedMatch.status} onValueChange={(value) => handleValueChange('status', value as Match['status'])}>
                                <SelectTrigger><SelectValue placeholder="Select status" /></SelectTrigger>
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
                                    <Button variant={"outline"} className={cn("w-full justify-start text-left font-normal", !editedMatch.date && "text-muted-foreground")}>
                                        <CalendarIcon className="mr-2 h-4 w-4" />
                                        {editedMatch.date ? format(new Date(editedMatch.date), "PPP") : <span>Pick a date</span>}
                                    </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-auto p-0"><Calendar mode="single" selected={editedMatch.date ? new Date(editedMatch.date) : undefined} onSelect={(d) => handleValueChange('date', d)} initialFocus/></PopoverContent>
                            </Popover>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2"><Label>Start Time</Label><Input type="time" value={editedMatch.startTime || ''} onChange={e => handleValueChange('startTime', e.target.value)} /></div>
                            <div className="space-y-2"><Label>End Time</Label><Input type="time" value={editedMatch.endTime || ''} onChange={e => handleValueChange('endTime', e.target.value)} /></div>
                        </div>
                         <div className="flex items-center space-x-2">
                            <Checkbox id="isDatePublished" checked={editedMatch.isDatePublished} onCheckedChange={(checked) => handleValueChange('isDatePublished', !!checked)} />
                            <Label htmlFor="isDatePublished" className="font-normal">Publish Date</Label>
                        </div>
                        {(!editedMatch.allPlayers || editedMatch.allPlayers.length === 0) && (
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2"><Label>Score: {getPlayerNames(editedMatch.player1, editedMatch.player1Placeholder)}</Label><Input type="number" value={editedMatch.score.player1} onChange={(e) => handleValueChange('score.player1', e.target.value)} /></div>
                                <div className="space-y-2"><Label>Score: {getPlayerNames(editedMatch.player2, editedMatch.player2Placeholder)}</Label><Input type="number" value={editedMatch.score.player2} onChange={(e) => handleValueChange('score.player2', e.target.value)} /></div>
                            </div>
                        )}
                    </div>
                </div>
                <DialogFooter>
                    <DialogClose asChild><Button variant="outline">Cancel</Button></DialogClose>
                    <Button onClick={handleSave} disabled={isSaving}>
                        {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Save Changes
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
         {playerPickerState && (
            <PlayerSelectionDialog
                open={playerPickerState.open}
                onOpenChange={(o) => setPlayerPickerState(prev => prev ? { ...prev, open: o } : null)}
                allPlayers={allPlayers}
                initialSelection={[]} // Start with empty selection for a swap
                onConfirm={handlePlayerSelection}
                capacity={1} // We are swapping one player at a time
            />
        )}
        </>
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

const MatchListSkeleton = () => (
    <div className="space-y-4">
        <div className="p-4 border rounded-lg bg-card space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
            </div>
        </div>
        <div className="rounded-md border">
            <Table>
                <TableHeader className="bg-muted/50">
                    <TableRow>
                        <TableHead><Skeleton className="h-5 w-24" /></TableHead>
                        <TableHead><Skeleton className="h-5 w-32" /></TableHead>
                        <TableHead><Skeleton className="h-5 w-48" /></TableHead>
                        <TableHead><Skeleton className="h-5 w-20" /></TableHead>
                        <TableHead><Skeleton className="h-5 w-20" /></TableHead>
                        <TableHead><Skeleton className="h-5 w-24" /></TableHead>
                        <TableHead className="text-right"><Skeleton className="h-5 w-16" /></TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                     {[...Array(10)].map((_, i) => (
                        <TableRow key={i}>
                            <TableCell><Skeleton className="h-5 w-24" /></TableCell>
                            <TableCell><Skeleton className="h-5 w-32" /></TableCell>
                            <TableCell><Skeleton className="h-5 w-48" /></TableCell>
                            <TableCell><Skeleton className="h-5 w-20" /></TableCell>
                            <TableCell><Skeleton className="h-5 w-20" /></TableCell>
                            <TableCell><Skeleton className="h-5 w-24" /></TableCell>
                            <TableCell className="text-right"><Skeleton className="h-8 w-8" /></TableCell>
                        </TableRow>
                     ))}
                </TableBody>
            </Table>
        </div>
    </div>
)


export function MatchList({ isAdmin = false, onFilteredMatchesChange }: { isAdmin?: boolean, onFilteredMatchesChange?: (matches: Match[]) => void }) {
  const [matchList, setMatchList] = React.useState<Match[]>([]);
  const [games, setGames] = React.useState<Game[]>([]);
  const [allPlayers, setAllPlayers] = React.useState<Player[]>([]);
  const [publicSettings, setPublicSettings] = React.useState<PublicSettings | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [editingMatch, setEditingMatch] = React.useState<Match | null>(null);
  const { user, isAdmin: authIsAdmin, loading: authLoading } = useAuth();
  const { toast } = useToast();

  const [filters, setFilters] = React.useState({
    search: '',
    branch: 'all',
    department: 'all',
    game: 'all',
    matchType: 'all',
    status: 'all',
  });
  
  const { sortedData: sortedMatches, requestSort, getSortDirection } = useSortableTable(matchList, {
    initialSort: [{ key: 'date', direction: 'desc' }]
  });

  React.useEffect(() => {
    async function loadData() {
        setLoading(true);
        try {
            const dataToFetch = [
                getMatchesOnce(),
                getGamesOnce(),
                getPlayersOnce(),
                !isAdmin ? getPublicSettings(s => setPublicSettings(s)) : Promise.resolve(null),
            ];

            const [matches, gamesData, playersData, settingsUnsub] = await Promise.all(dataToFetch);

            setMatchList(matches as Match[]);
            setGames(gamesData as Game[]);
            setAllPlayers(playersData as Player[]);
            
            if (settingsUnsub && typeof settingsUnsub === 'function') {
                return () => settingsUnsub();
            }

        } catch (error) {
            toast({ title: 'Error', description: 'Failed to load match data.', variant: 'destructive' });
            console.error(error);
        } finally {
            setLoading(false);
        }
    }
    loadData();
  }, [isAdmin, toast]);


  const handleFilterChange = (key: keyof typeof filters, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const filteredMatches = React.useMemo(() => {
    let matches = sortedMatches;

    if (!isAdmin && publicSettings) {
        matches = matches.filter(m => publicSettings.visibleStatuses[m.status] ?? true);
    }
    
    return matches.filter(match => {
        const searchLower = filters.search.toLowerCase();

        const allPlayersInMatch = [...(match.allPlayers || []), ...match.player1, ...match.player2].filter(p => p.name);
        const nameMatch = filters.search ? 
            allPlayersInMatch.some(p => p.name.toLowerCase().includes(searchLower)) ||
            (match.player1Placeholder && match.player1Placeholder.toLowerCase().includes(searchLower)) ||
            (match.player2Placeholder && match.player2Placeholder.toLowerCase().includes(searchLower))
            : true;
        
        const branchMatch = filters.branch === 'all' ? true : 
            allPlayersInMatch.some(p => p.branch === filters.branch);
            
        const departmentMatch = filters.department === 'all' ? true :
            allPlayersInMatch.some(p => p.department === filters.department);

        const gameMatch = filters.game === 'all' ? true : match.game === filters.game;

        const matchTypeMatch = filters.matchType === 'all' ? true : match.matchType === filters.matchType;
        
        const statusMatch = filters.status === 'all' ? true : match.status === filters.status;

        return nameMatch && branchMatch && departmentMatch && gameMatch && matchTypeMatch && statusMatch;
    });
  }, [sortedMatches, filters, isAdmin, publicSettings]);
  
  React.useEffect(() => {
    if(onFilteredMatchesChange) {
      onFilteredMatchesChange(filteredMatches);
    }
  }, [filteredMatches, onFilteredMatchesChange]);

  const allGames = React.useMemo(() => {
    return games.sort((a,b) => a.name.localeCompare(b.name));
  }, [games]);

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
    return <MatchListSkeleton />
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
                        {allGames.map(g => <SelectItem key={g.id} value={g.name}>{g.name}</SelectItem>)}
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
                 <SortableTableHeader
                    label="Tournament"
                    sortKey="tournamentName"
                    requestSort={requestSort}
                    getSortDirection={getSortDirection}
                />
                 <SortableTableHeader
                    label="Match"
                    sortKey="matchName"
                    requestSort={requestSort}
                    getSortDirection={getSortDirection}
                />
                 <SortableTableHeader
                    label="Players"
                    isSortable={false}
                />
                <SortableTableHeader
                    label="Date"
                    sortKey="date"
                    requestSort={requestSort}
                    getSortDirection={getSortDirection}
                />
                <SortableTableHeader
                    label="Status"
                    sortKey="status"
                    requestSort={requestSort}
                    getSortDirection={getSortDirection}
                />
                <SortableTableHeader
                    label="Winner"
                    sortKey="winnerId"
                    requestSort={requestSort}
                    getSortDirection={getSortDirection}
                />
                {isAdmin && <SortableTableHeader label="Actions" className="text-right" isSortable={false} />}
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredMatches.length > 0 ? filteredMatches.map((match) => {
                let formattedDate = null;
                if (match.date && match.isDatePublished) {
                    try {
                        const jsDate = (match.date as any).toDate ? (match.date as any).toDate() : new Date(match.date);
                        if (!isNaN(jsDate.getTime())) {
                            formattedDate = format(jsDate, 'PP');
                        }
                    } catch (e) {
                        // Invalid date, leave as null
                    }
                }
                return (
                <TableRow key={match.id} className="odd:bg-muted/10">
                  <TableCell className="font-medium whitespace-nowrap">{match.tournamentName} <span className="text-muted-foreground text-xs">({match.game})</span></TableCell>
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
                    {formattedDate ? formattedDate : <span className="text-muted-foreground">TBD</span>}
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
              )}) : (
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
                  setMatchList(prev => prev.map(m => m.id === updatedMatch.id ? { ...m, ...updatedMatch } : m));
                  setEditingMatch(null);
              }}
              allPlayers={allPlayers}
          />
        )}
    </div>
  );
}

