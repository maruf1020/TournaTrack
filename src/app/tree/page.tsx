
'use client';

import * as React from 'react';
import AppLayout from '@/components/layout/AppLayout';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent } from '@/components/ui/card';
import type { Match as DBMatch } from '@/lib/types';
import { getMatches } from '@/lib/services';
import { Loader2, ZoomIn, ZoomOut, RotateCcw } from 'lucide-react';
import { groupMatchesByRound } from '@/lib/bracket-utils';
import { TournamentBracket } from '@/components/TournamentBracket';
import { Skeleton } from '@/components/ui/skeleton';
import { TransformWrapper, TransformComponent } from 'react-zoom-pan-pinch';
import { Button } from '@/components/ui/button';

const BracketSkeleton = () => (
    <div className="flex space-x-8 p-4 overflow-hidden">
        {[1, 2, 3].map(round => (
            <div key={round} className="space-y-12 min-w-56">
                <Skeleton className="h-8 w-3/4 mb-4" />
                {[1, 2, 3, 4].slice(0, 4 / round).map(match => (
                    <Skeleton key={match} className="h-24 w-full" />
                ))}
            </div>
        ))}
    </div>
);


export default function TournamentTreePage() {
  const [allMatches, setAllMatches] = React.useState<DBMatch[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [selectedTournamentName, setSelectedTournamentName] = React.useState<string | undefined>();
  
  React.useEffect(() => {
    setLoading(true);
    const unsubMatches = getMatches((matches) => {
      setAllMatches(matches);
      if (matches.length > 0) {
        const tournamentNames = [...new Set(matches.filter(m => m.game).map(m => m.game))].sort();
        if (tournamentNames.length > 0 && !selectedTournamentName) {
            setSelectedTournamentName(tournamentNames[0]);
        }
      }
      setLoading(false);
    });

    return () => unsubMatches();
  }, []);
  
  const tournamentNames = React.useMemo(() => {
    return [...new Set(allMatches.filter(m => m.game).map(m => m.game))].sort();
  }, [allMatches]);

  const bracketRounds = React.useMemo(() => {
     if (!selectedTournamentName) return [];
     const tournamentMatches = allMatches.filter(m => m.game === selectedTournamentName);
     return groupMatchesByRound(tournamentMatches);
  }, [selectedTournamentName, allMatches]);

  const hasMatchesForTournament = bracketRounds.length > 0 && bracketRounds.some(r => r.matches.length > 0);

  return (
    <AppLayout>
      <div className="flex-1 space-y-4 p-4 sm:p-8 pt-6 flex flex-col h-full md:w-screen-minus-sidebar max-h-screen-minus-14 overflow-auto">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between space-y-4 sm:space-y-0">
          <h1 className="text-3xl font-bold tracking-tight font-headline">
            Tournament Tree
          </h1>
          <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
            <Select value={selectedTournamentName} onValueChange={setSelectedTournamentName} disabled={loading || tournamentNames.length === 0}>
              <SelectTrigger className="w-full sm:w-[280px]">
                <SelectValue placeholder="Select a tournament" />
              </SelectTrigger>
              <SelectContent>
                {loading ? (
                    <SelectItem value="loading" disabled>Loading...</SelectItem>
                ) : tournamentNames.length > 0 ? (
                    tournamentNames.map(name => (
                        <SelectItem key={name} value={name}>{name}</SelectItem>
                    ))
                ) : (
                    <SelectItem value="no-tournaments" disabled>No tournaments found</SelectItem>
                )}
              </SelectContent>
            </Select>
          </div>
        </div>

        <Card className="flex-1 flex flex-col max-h-parent-minus-14">
            {loading ? (
                <div className="flex-1 flex items-center justify-center">
                    <BracketSkeleton />
                </div>
            ) : hasMatchesForTournament ? (
                <TransformWrapper
                    initialScale={1}
                    minScale={0.2}
                    maxScale={2.5}
                    limitToBounds={false}
                    panning={{ velocityDisabled: true }}
                >
                    {({ zoomIn, zoomOut, resetTransform, ...rest }) => (
                    <React.Fragment>
                        <div className="flex items-center gap-2 p-2 border-b">
                            <Button variant="outline" size="sm" onClick={() => zoomIn()}>
                                <ZoomIn className="h-4 w-4 mr-2" /> Zoom In
                            </Button>
                            <Button variant="outline" size="sm" onClick={() => zoomOut()}>
                                <ZoomOut className="h-4 w-4 mr-2" /> Zoom Out
                            </Button>
                            <Button variant="outline" size="sm" onClick={() => resetTransform()}>
                                <RotateCcw className="h-4 w-4 mr-2" /> Reset
                            </Button>
                        </div>
                        <div className="flex-1 overflow-hidden cursor-grab active:cursor-grabbing">
                          <TransformComponent
                              wrapperStyle={{ width: '100%', height: '100%' }}
                              contentStyle={{ width: '100%', height: '100%' }}
                          >
                            <div className="p-4">
                                <TournamentBracket rounds={bracketRounds} />
                            </div>
                          </TransformComponent>
                        </div>
                    </React.Fragment>
                    )}
                </TransformWrapper>
            ) : (
                <div className="flex-1 text-center py-16 text-muted-foreground flex flex-col items-center justify-center h-full">
                    <p className="text-lg font-medium">No matches found for this tournament.</p>
                    <p className="text-sm">Create a tournament in the Admin panel to see the tree.</p>
                </div>
            )}
        </Card>
      </div>
    </AppLayout>
  );
}
