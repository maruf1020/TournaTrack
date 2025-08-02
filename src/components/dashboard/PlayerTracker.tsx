
'use client';

import * as React from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { User, Search, Edit2, UserSearch } from 'lucide-react';
import type { Player, Match } from '@/lib/types';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { ScrollArea } from '@/components/ui/scroll-area';

const PlayerListDisplay = ({ players, isWinner }: { players: Player[]; isWinner?: boolean }) => {
  return (
    <div className={cn(isWinner && 'font-bold text-emerald-600')}>
      {players.map((p, index) => (
        <div key={p.id}>
          {players.length > 1 && `${index + 1}. `}
          {p.name}
        </div>
      ))}
    </div>
  );
};

function MatchRow({ match, selectedPlayerId }: { match: Match; selectedPlayerId: string }) {
    const isP1 = match.player1.some(p => p.id === selectedPlayerId);
    const isP2 = match.player2.some(p => p.id === selectedPlayerId);
    const isBR = match.allPlayers?.some(p => p.id === selectedPlayerId);

    const p1IsWinner = match.winnerId && match.player1.some(p => p.id === match.winnerId);
    const p2IsWinner = match.winnerId && match.player2.some(p => p.id === match.winnerId);
    const brWinner = match.winnerId && match.allPlayers?.find(p => p.id === match.winnerId);

    const opponent = isP1 ? match.player2 : match.player1;
    const opponentPlaceholder = isP1 ? match.player2Placeholder : match.player1Placeholder;

    let result: 'win' | 'loss' | 'pending' = 'pending';
    if(match.status === 'finished' && match.winnerId) {
        if(isP1 && p1IsWinner) result = 'win';
        else if (isP2 && p2IsWinner) result = 'win';
        else if (isBR && brWinner?.id === selectedPlayerId) result = 'win';
        else result = 'loss';
    }

    let formattedDate = null;
    if (match.date) {
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
        <div className="p-3 rounded-md bg-muted/50 space-y-2">
            <div className="flex items-center justify-between text-sm">
                <p className="font-semibold">{match.tournamentName} <span className="font-normal text-muted-foreground">({match.matchType})</span></p>
                <div className="flex items-center gap-2">
                     <span className={cn(
                        'font-semibold text-xs uppercase px-2 py-0.5 rounded-full',
                        result === 'win' && 'bg-emerald-100 text-emerald-800',
                        result === 'loss' && 'bg-rose-100 text-rose-800',
                        result === 'pending' && 'bg-slate-100 text-slate-800'
                     )}>{result}</span>
                    {formattedDate && (
                        <div className="font-medium">{formattedDate}</div>
                    )}
                </div>
            </div>
            <div className="text-sm text-muted-foreground">
                {isBR ? (
                    <p>
                        Battle Royale vs. {match.allPlayers!.length - 1} others.
                        {brWinner && (
                            <span className={cn('font-semibold', brWinner.id === selectedPlayerId ? 'text-emerald-600' : 'text-rose-600')}>
                                {' '}Winner: {brWinner.name}
                            </span>
                        )}
                    </p>
                ) : (
                    <>
                        vs. {' '}
                        <span className="font-medium text-foreground">
                             {opponent.length > 0 ? opponent.map(p => p.name).join(' & ') : opponentPlaceholder || 'TBD'}
                        </span>
                    </>
                )}
            </div>
        </div>
    )
}

export default function PlayerTracker({ allPlayers, allMatches }: { allPlayers: Player[]; allMatches: Match[] }) {
  const [selectedPlayerId, setSelectedPlayerId] = React.useState<string | null>(null);
  const [isMounted, setIsMounted] = React.useState(false);

  React.useEffect(() => {
    setIsMounted(true);
    const savedPlayerId = localStorage.getItem('trackedPlayerId');
    if (savedPlayerId) {
      setSelectedPlayerId(savedPlayerId);
    }
  }, []);

  const handlePlayerChange = (playerId: string) => {
    setSelectedPlayerId(playerId);
    localStorage.setItem('trackedPlayerId', playerId);
  };

  const clearSelection = () => {
    setSelectedPlayerId(null);
    localStorage.removeItem('trackedPlayerId');
  }

  const selectedPlayer = React.useMemo(() => {
    return allPlayers.find((p) => p.id === selectedPlayerId);
  }, [selectedPlayerId, allPlayers]);


  const playerMatches = React.useMemo(() => {
    if (!selectedPlayerId) return [];
    return allMatches
      .filter(
        (m) =>
          m.player1.some((p) => p.id === selectedPlayerId) ||
          m.player2.some((p) => p.id === selectedPlayerId) ||
          (m.allPlayers && m.allPlayers.some((p) => p.id === selectedPlayerId))
      )
      .sort((a, b) => {
        const dateA = a.date ? ((a.date as any).toDate ? (a.date as any).toDate() : new Date(a.date)) : null;
        const dateB = b.date ? ((b.date as any).toDate ? (b.date as any).toDate() : new Date(b.date)) : null;
        if (a.status === 'upcoming' && b.status !== 'upcoming') return -1;
        if (a.status !== 'upcoming' && b.status === 'upcoming') return 1;
        if (dateA && dateB) return dateB.getTime() - dateA.getTime();
        return 0;
      });
  }, [selectedPlayerId, allMatches]);

  if (!isMounted) {
    return (
        <Card>
            <CardHeader>
                <CardTitle>Loading Player Tracker...</CardTitle>
            </CardHeader>
            <CardContent>
                <div className="h-48 flex items-center justify-center">
                    <UserSearch className="w-12 h-12 text-muted-foreground animate-pulse" />
                </div>
            </CardContent>
        </Card>
    );
  }

  if (!selectedPlayerId || !selectedPlayer) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><UserSearch /> Player Match Tracker</CardTitle>
          <CardDescription>Select a player to see all of their match details.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4">
            <Select onValueChange={handlePlayerChange}>
              <SelectTrigger className="w-full md:w-[300px]">
                <SelectValue placeholder="Select a player..." />
              </SelectTrigger>
              <SelectContent>
                {allPlayers
                  .sort((a, b) => a.name.localeCompare(b.name))
                  .map((player) => (
                    <SelectItem key={player.id} value={player.id}>
                      {player.name}
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
        <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
                <CardTitle className="flex items-center gap-2"><User /> {selectedPlayer.name}'s Matches</CardTitle>
                <CardDescription>A summary of all upcoming and past matches for the selected player.</CardDescription>
            </div>
            <div className="w-full sm:w-auto flex justify-start sm:justify-end">
                <Button variant="outline" size="sm" onClick={clearSelection}>
                    <Edit2 className="mr-2 h-4 w-4"/>
                    Change Player
                </Button>
            </div>
        </CardHeader>
      <CardContent>
        {playerMatches.length > 0 ? (
            <ScrollArea className="h-96 pr-4">
                <div className="space-y-4">
                    {playerMatches.map(match => (
                        <MatchRow key={match.id} match={match} selectedPlayerId={selectedPlayerId} />
                    ))}
                </div>
           </ScrollArea>
        ) : (
            <div className="text-center text-muted-foreground py-16">
                <p>{selectedPlayer.name} is not currently in any matches.</p>
            </div>
        )}
      </CardContent>
    </Card>
  );
}
