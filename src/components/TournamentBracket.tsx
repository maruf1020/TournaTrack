
'use client';

import * as React from 'react';
import type { BracketRound } from '@/lib/bracket-utils';
import type { Player } from '@/lib/types';
import { cn } from '@/lib/utils';
import { StatusBadge } from './ui/status-badge';
import { Popover, PopoverContent, PopoverTrigger } from './ui/popover';
import { Button } from './ui/button';
import { Info, Users } from 'lucide-react';

const PlayerListPopover = ({ players }: { players: Player[] }) => {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="h-5 w-5 ml-1 text-primary hover:text-primary/80">
          <Info className="h-4 w-4" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-60">
        <div className="space-y-2">
          <h4 className="font-medium leading-none flex items-center gap-2"><Users className="h-4 w-4" /> {players.length > 1 ? 'Team Roster' : 'Player Info'}</h4>
          <div className="text-sm text-muted-foreground space-y-1">
            {players.map((p, index) => (
              <div key={p.id}>
                {players.length > 1 ? `${index + 1}. ` : ''}{p.name}
              </div>
            ))}
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
};


const Team = ({ players, placeholder }: { players?: Player[]; placeholder?: string }) => {
  if (placeholder) {
    return <div className="text-sm italic opacity-70">{placeholder}</div>;
  }
  if (!players || players.length === 0) {
    return <div className="text-sm italic opacity-70">TBD</div>;
  }
  
  const isMultiPlayer = players.length > 1;
  const mainPlayerName = players[0].name;
  const isTruncated = !isMultiPlayer && mainPlayerName.length > 24;
  const showInfoIcon = isMultiPlayer || isTruncated;

  let displayName: string;
  if (isMultiPlayer) {
    displayName = `${mainPlayerName} (${players.length})`;
  } else if (isTruncated) {
    displayName = `${mainPlayerName.substring(0, 20)}...`;
  } else {
    displayName = mainPlayerName;
  }


  return (
    <div className="flex items-center text-sm font-medium">
      <span className="truncate">
        {displayName}
      </span>
      {showInfoIcon && <PlayerListPopover players={players} />}
    </div>
  );
};

const MatchCard = ({ match, isHighlighted }: { match: BracketRound['matches'][0], isHighlighted?: boolean }) => {
  const isFinished = match.status === 'finished';
  
  const p1IsWinner = match.winnerId && match.player1.some(p => p.id === match.winnerId);
  const p2IsWinner = match.winnerId && match.player2.some(p => p.id === match.winnerId);
  const brWinner = match.winnerId && match.allPlayers?.find(p => p.id === match.winnerId);

  return (
    <div 
      id={match.id}
      className={cn(
          "w-60 rounded-lg border bg-card text-card-foreground shadow-sm relative transition-all duration-300",
          isHighlighted && "ring-2 ring-primary scale-[0.98]"
      )}
    >
      <div className="p-3">
        <div className="flex justify-between items-center mb-2">
            <h4 className="text-xs font-semibold text-muted-foreground truncate">{match.matchName}</h4>
            <StatusBadge status={match.status} />
        </div>
        
        {match.allPlayers ? (
             <div className="space-y-2">
                <p className="font-semibold">Battle Royale ({match.allPlayers.length} players)</p>
                {isFinished && brWinner && (
                    <div className={cn("font-bold text-emerald-600")}>
                        Winner: {brWinner.name}
                    </div>
                )}
             </div>
        ) : (
            <div className="space-y-2">
                <div className={cn("flex justify-between items-center", isFinished && p1IsWinner && "font-bold text-emerald-600")}>
                    <Team players={match.player1} placeholder={match.player1Placeholder} />
                    {isFinished && <div className="font-mono">{match.score.player1}</div>}
                </div>
                
                <div className="relative">
                    <div className="absolute inset-0 flex items-center">
                        <span className="w-full border-t" />
                    </div>
                    <div className="relative flex justify-center text-xs uppercase">
                        <span className="bg-card px-2 text-muted-foreground">vs</span>
                    </div>
                </div>

                <div className={cn("flex justify-between items-center", isFinished && p2IsWinner && "font-bold text-emerald-600")}>
                    <Team players={match.player2} placeholder={match.player2Placeholder} />
                    {isFinished && <div className="font-mono">{match.score.player2}</div>}
                </div>
            </div>
        )}
      </div>
    </div>
  );
};

export function TournamentBracket({ rounds, highlightedMatchId }: { rounds: BracketRound[], highlightedMatchId?: string }) {
  if (!rounds || rounds.length === 0) return null;

  const ROUND_GAP = 100;
  const CARD_WIDTH = 240;
  const MIN_CARD_SPACING = 40; // Minimum gap between cards

  // Refs to measure card heights
  const cardRefs = React.useRef<{ [key: string]: HTMLDivElement | null }>({});
  const [cardHeights, setCardHeights] = React.useState<{ [key: string]: number }>({});
  const [layoutReady, setLayoutReady] = React.useState(false);

  // Measure card heights after render
  React.useEffect(() => {
    const heights: { [key: string]: number } = {};
    let allMeasured = true;

    rounds.forEach(round => {
      round.matches.forEach(match => {
        const cardElement = cardRefs.current[match.id];
        if (cardElement) {
          heights[match.id] = cardElement.offsetHeight;
        } else {
          allMeasured = false;
        }
      });
    });

    if (allMeasured && Object.keys(heights).length > 0) {
      setCardHeights(heights);
      setLayoutReady(true);
    }
  }, [rounds]);

  // Calculate positions for each match using actual card heights
  const calculateLayout = () => {
    if (!layoutReady) return [];
    
    const layout: Array<{ round: BracketRound; x: number; matches: Array<{ match: any; y: number; height: number }> }> = [];
    
    rounds.forEach((round, roundIndex) => {
      const x = roundIndex * (CARD_WIDTH + ROUND_GAP);
      
      if (roundIndex === 0) {
        // First round: stack matches with proper spacing based on their heights
        let currentY = 0;
        const matches = round.matches.map((match, matchIndex) => {
          const height = cardHeights[match.id] || 120;
          const y = currentY;
          currentY += height + MIN_CARD_SPACING;
          return { match, y, height };
        });
        layout.push({ round, x, matches });
      } else {
        // Later rounds: position between their feeder matches
        const prevRound = layout[roundIndex - 1];
        const matches = round.matches.map((match, matchIndex) => {
          const height = cardHeights[match.id] || 120;
          
          // Find the two matches from previous round that feed into this match
          const feeder1Index = matchIndex * 2;
          const feeder2Index = matchIndex * 2 + 1;
          
          const feeder1 = prevRound.matches[feeder1Index];
          const feeder2 = prevRound.matches[feeder2Index];
          
          let y: number;
          if (feeder1 && feeder2) {
            // Position between the two feeder matches (center of their combined area)
            const feeder1Center = feeder1.y + feeder1.height / 2;
            const feeder2Center = feeder2.y + feeder2.height / 2;
            const centerPoint = (feeder1Center + feeder2Center) / 2;
            y = centerPoint - height / 2; // Center this card on the center point
          } else if (feeder1) {
            // Only one feeder match - center on it
            const feeder1Center = feeder1.y + feeder1.height / 2;
            y = feeder1Center - height / 2;
          } else {
            // Fallback
            y = matchIndex * (height + MIN_CARD_SPACING);
          }
          
          return { match, y, height };
        });
        
        layout.push({ round, x, matches });
      }
    });
    
    return layout;
  };

  const layout = calculateLayout();
  
  // Calculate total dimensions
  const totalWidth = (rounds.length - 1) * (CARD_WIDTH + ROUND_GAP) + CARD_WIDTH;
  const totalHeight = layout.length > 0 ? 
    Math.max(800, Math.max(...layout.map(round => {
      const lastMatch = round.matches[round.matches.length - 1];
      return lastMatch ? lastMatch.y + lastMatch.height + 100 : 0;
    }))) : 800;

  // Generate connecting lines using actual card positions and heights
  const generateConnections = () => {
    if (!layoutReady) return [];
    
    const connections: JSX.Element[] = [];
    
    for (let roundIndex = 0; roundIndex < rounds.length - 1; roundIndex++) {
      const currentRound = layout[roundIndex];
      const nextRound = layout[roundIndex + 1];
      
      // Group current round matches in pairs
      for (let i = 0; i < currentRound.matches.length; i += 2) {
        const match1 = currentRound.matches[i];
        const match2 = currentRound.matches[i + 1];
        const nextMatchIndex = Math.floor(i / 2);
        const nextMatch = nextRound.matches[nextMatchIndex];
        
        if (match1 && nextMatch) {
          const x1 = currentRound.x + CARD_WIDTH;
          const y1 = match1.y + match1.height / 2 + 80; // Center of first card + header offset
          const x2 = nextRound.x;
          const y2 = nextMatch.y + nextMatch.height / 2 + 80; // Center of next card + header offset
          const midX = x1 + (ROUND_GAP / 2);
          
          if (match2) {
            // Two matches connecting to one
            const y1_2 = match2.y + match2.height / 2 + 80; // Center of second card + header offset
            const midY = (y1 + y1_2) / 2;
            
            connections.push(
              <g key={`connection-${roundIndex}-${i}`}>
                {/* Horizontal line from first match */}
                <line
                  x1={x1}
                  y1={y1}
                  x2={midX}
                  y2={y1}
                  stroke="hsl(var(--border))"
                  strokeWidth="2"
                />
                {/* Horizontal line from second match */}
                <line
                  x1={x1}
                  y1={y1_2}
                  x2={midX}
                  y2={y1_2}
                  stroke="hsl(var(--border))"
                  strokeWidth="2"
                />
                {/* Vertical connecting line */}
                <line
                  x1={midX}
                  y1={y1}
                  x2={midX}
                  y2={y1_2}
                  stroke="hsl(var(--border))"
                  strokeWidth="2"
                />
                {/* Horizontal line to next match */}
                <line
                  x1={midX}
                  y1={midY}
                  x2={x2}
                  y2={y2}
                  stroke="hsl(var(--border))"
                  strokeWidth="2"
                />
              </g>
            );
          } else {
            // Single match connecting directly
            connections.push(
              <line
                key={`connection-${roundIndex}-${i}`}
                x1={x1}
                y1={y1}
                x2={x2}
                y2={y2}
                stroke="hsl(var(--border))"
                strokeWidth="2"
              />
            );
          }
        }
      }
    }
    
    return connections;
  };

  return (
    <div className="relative w-full overflow-auto">
      <div className="relative" style={{ width: totalWidth, height: totalHeight, minHeight: '600px' }}>
        {/* Hidden cards for measurement */}
        {!layoutReady && (
          <div className="absolute opacity-0 pointer-events-none">
            {rounds.map(round =>
              round.matches.map(match => (
                <div
                  key={`measure-${match.id}`}
                  ref={(el) => {
                    cardRefs.current[match.id] = el;
                  }}
                  style={{ width: CARD_WIDTH }}
                >
                  <MatchCard match={match} />
                </div>
              ))
            )}
          </div>
        )}

        {layoutReady && (
          <>
            {/* SVG for connecting lines */}
            <svg
              className="absolute inset-0 pointer-events-none"
              width={totalWidth}
              height={totalHeight}
              style={{ zIndex: 1 }}
            >
              {generateConnections()}
            </svg>
            
            {/* Tournament rounds and matches */}
            {layout.map(({ round, x, matches }, roundIndex) => (
              <div key={round.name} className="absolute" style={{ left: x, top: 0 }}>
                {/* Round header */}
                <div className="sticky top-0 z-20 py-4 mb-8">
                  <h3 className="text-lg font-bold text-center">{round.name}</h3>
                </div>
                
                {/* Matches */}
                {matches.map(({ match, y }) => (
                  <div
                    key={match.id}
                    className="absolute"
                    style={{ top: y + 80 }}
                  >
                    <MatchCard match={match} isHighlighted={match.id === highlightedMatchId} />
                  </div>
                ))}
              </div>
            ))}
          </>
        )}
      </div>
    </div>
  );
}
