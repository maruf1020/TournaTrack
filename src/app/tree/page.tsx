

'use client';

import * as React from 'react';
import AppLayout from '@/components/layout/AppLayout';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent } from '@/components/ui/card';
import type { Match as DBMatch, Tournament, Player } from '@/lib/types';
import { getMatchesOnce } from '@/lib/services';
import { Loader2, ZoomIn, ZoomOut, RotateCcw, Search, ChevronLeft, ChevronRight } from 'lucide-react';
import { groupMatchesByRound, groupMatchesByGroup } from '@/lib/bracket-utils';
import { TournamentBracket } from '@/components/TournamentBracket';
import { Skeleton } from '@/components/ui/skeleton';
import { TransformWrapper, TransformComponent, type ReactZoomPanPinchRef } from 'react-zoom-pan-pinch';
import { Button } from '@/components/ui/button';
import { GroupStageDisplay } from '@/components/GroupStageDisplay';
import { Input } from '@/components/ui/input';

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
  const [selectedTournament, setSelectedTournament] = React.useState<Tournament | undefined>();
  const [searchQuery, setSearchQuery] = React.useState('');
  const [searchResults, setSearchResults] = React.useState<string[]>([]);
  const [currentResultIndex, setCurrentResultIndex] = React.useState(-1);
  const transformRef = React.useRef<ReactZoomPanPinchRef | null>(null);
  
  React.useEffect(() => {
    const loadMatches = async () => {
        setLoading(true);
        try {
            const matches = await getMatchesOnce();
            setAllMatches(matches);
            if (matches.length > 0) {
                const tournamentNames = [...new Set(matches.filter(m => m.tournamentName).map(m => m.tournamentName))].sort();
                if (tournamentNames.length > 0 && !selectedTournament) {
                    const firstTournamentMatches = matches.filter(m => m.tournamentName === tournamentNames[0]);
                    setSelectedTournament({
                        id: tournamentNames[0],
                        name: tournamentNames[0],
                        tournamentType: firstTournamentMatches[0]?.tournamentType || 'Knockout',
                        branch: '', // Not needed for this view
                        game: '', // Not needed for this view
                        rounds: [], // Not needed for this view
                    });
                }
            }
        } catch (error) {
            console.error("Failed to load matches for tree view:", error);
        } finally {
            setLoading(false);
        }
    };
    loadMatches();
  }, []);
  
  const tournaments = React.useMemo(() => {
    const tournamentMap = new Map<string, Tournament>();
    allMatches.forEach(match => {
        if(match.tournamentName && !tournamentMap.has(match.tournamentName)) {
            tournamentMap.set(match.tournamentName, {
                id: match.tournamentName,
                name: match.tournamentName,
                tournamentType: match.tournamentType || 'Knockout',
                branch: '', game: '', rounds: []
            });
        }
    });
    return Array.from(tournamentMap.values()).sort((a,b) => a.name.localeCompare(b.name));
  }, [allMatches]);

  const handleTournamentChange = (tournamentName: string) => {
    const tournament = tournaments.find(t => t.name === tournamentName);
    setSelectedTournament(tournament);
    setSearchQuery('');
    setSearchResults([]);
    setCurrentResultIndex(-1);
  }

  const bracketRounds = React.useMemo(() => {
     if (!selectedTournament || selectedTournament.tournamentType !== 'Knockout') return [];
     const tournamentMatches = allMatches.filter(m => m.tournamentName === selectedTournament.name);
     return groupMatchesByRound(tournamentMatches);
  }, [selectedTournament, allMatches]);

  const groupStageData = React.useMemo(() => {
     if (!selectedTournament || selectedTournament.tournamentType !== 'Group Stage') return [];
     const tournamentMatches = allMatches.filter(m => m.tournamentName === selectedTournament.name);
     return groupMatchesByGroup(tournamentMatches);
  }, [selectedTournament, allMatches]);

  const hasMatchesForTournament = (selectedTournament?.tournamentType === 'Knockout' && bracketRounds.length > 0 && bracketRounds.some(r => r.matches.length > 0)) ||
                                   (selectedTournament?.tournamentType === 'Group Stage' && groupStageData.length > 0 && groupStageData.some(g => g.matches.length > 0));


  const navigateResults = (direction: 'next' | 'prev') => {
    if (searchResults.length === 0) return;
    
    let newIndex = currentResultIndex;
    if (direction === 'next') {
        newIndex = (currentResultIndex + 1) % searchResults.length;
    } else {
        newIndex = (currentResultIndex - 1 + searchResults.length) % searchResults.length;
    }
    
    setCurrentResultIndex(newIndex);
    transformRef.current?.zoomToElement(searchResults[newIndex], 1.2, 300, 'easeOut');
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    // If there are already results, pressing enter just navigates to the next one
    if (searchResults.length > 0) {
        navigateResults('next');
        return;
    }

    if (!searchQuery) {
        setSearchResults([]);
        setCurrentResultIndex(-1);
        return;
    }

    const lowerCaseQuery = searchQuery.toLowerCase();
    const results: string[] = [];
    bracketRounds.forEach(round => {
        round.matches.forEach(match => {
            const allPlayers = [...match.player1, ...match.player2];
            const found = allPlayers.some(p => p.name.toLowerCase().includes(lowerCaseQuery));
            if (found) {
                results.push(match.id);
            }
        });
    });

    setSearchResults(results);
    if (results.length > 0) {
        setCurrentResultIndex(0);
        transformRef.current?.zoomToElement(results[0], 1.2, 300, 'easeOut');
    } else {
        setCurrentResultIndex(-1);
    }
  };

  return (
    <AppLayout>
      <div className="flex-1 space-y-4 p-4 sm:p-8 pt-6 flex flex-col h-full md:w-screen-minus-sidebar max-h-screen-minus-14 overflow-auto">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between space-y-4 sm:space-y-0">
          <h1 className="text-3xl font-bold tracking-tight font-headline">
            Tournament View
          </h1>
          <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
            <Select value={selectedTournament?.name} onValueChange={handleTournamentChange} disabled={loading || tournaments.length === 0}>
              <SelectTrigger className="w-full sm:w-[280px]">
                <SelectValue placeholder="Select a tournament" />
              </SelectTrigger>
              <SelectContent>
                {loading ? (
                    <SelectItem value="loading" disabled>Loading...</SelectItem>
                ) : tournaments.length > 0 ? (
                    tournaments.map(t => (
                        <SelectItem key={t.id} value={t.name}>{t.name}</SelectItem>
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
            ) : !hasMatchesForTournament ? (
                <div className="flex-1 text-center py-16 text-muted-foreground flex flex-col items-center justify-center h-full">
                    <p className="text-lg font-medium">No matches found for this tournament.</p>
                    <p className="text-sm">Create a tournament in the Admin panel to see the view.</p>
                </div>
            ) : selectedTournament?.tournamentType === 'Group Stage' ? (
                <div className="p-4 overflow-auto">
                  <GroupStageDisplay groups={groupStageData} />
                </div>
            ) : (
                <TransformWrapper
                    ref={transformRef}
                    initialScale={1}
                    minScale={0.2}
                    maxScale={2.5}
                    limitToBounds={false}
                    panning={{ velocityDisabled: true }}
                >
                    {({ zoomIn, zoomOut, resetTransform, ...rest }) => (
                    <React.Fragment>
                        <div className="flex items-center flex-wrap gap-2 p-2 border-b">
                            <Button variant="outline" size="sm" onClick={() => zoomIn()}>
                                <ZoomIn className="h-4 w-4 sm:mr-2" />
                                <span className="hidden sm:inline">Zoom In</span>
                            </Button>
                            <Button variant="outline" size="sm" onClick={() => zoomOut()}>
                                <ZoomOut className="h-4 w-4 sm:mr-2" />
                                <span className="hidden sm:inline">Zoom Out</span>
                            </Button>
                            <Button variant="outline" size="sm" onClick={() => resetTransform()}>
                                <RotateCcw className="h-4 w-4 sm:mr-2" />
                                <span className="hidden sm:inline">Reset</span>
                            </Button>
                            <form onSubmit={handleSearch} className="flex items-center gap-2">
                                <Input
                                    placeholder="Search player..."
                                    className="h-9 w-40"
                                    value={searchQuery}
                                    onChange={e => setSearchQuery(e.target.value)}
                                />
                                <Button type="submit" variant="outline" size="sm">
                                    <Search className="h-4 w-4" />
                                </Button>
                                {searchResults.length > 0 && (
                                    <>
                                        <Button type="button" variant="outline" size="icon" className="h-9 w-9" onClick={() => navigateResults('prev')}>
                                            <ChevronLeft className="h-4 w-4" />
                                        </Button>
                                         <Button type="button" variant="outline" size="icon" className="h-9 w-9" onClick={() => navigateResults('next')}>
                                            <ChevronRight className="h-4 w-4" />
                                        </Button>
                                        <span className="text-xs text-muted-foreground">{currentResultIndex + 1} / {searchResults.length}</span>
                                    </>
                                )}
                            </form>
                        </div>
                        <div className="flex-1 overflow-hidden cursor-grab active:cursor-grabbing">
                          <TransformComponent
                              wrapperStyle={{ width: '100%', height: '100%' }}
                              contentStyle={{ width: '100%', height: '100%' }}
                          >
                            <div className="p-4">
                                <TournamentBracket rounds={bracketRounds} highlightedMatchId={searchResults.length > 0 ? searchResults[currentResultIndex] : undefined}/>
                            </div>
                          </TransformComponent>
                        </div>
                    </React.Fragment>
                    )}
                </TransformWrapper>
            )}
        </Card>
      </div>
    </AppLayout>
  );
}
