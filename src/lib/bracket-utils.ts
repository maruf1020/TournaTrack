
/**
 * @fileoverview
 * Utility functions for processing tournament data for bracket visualization.
 * This file transforms Firestore match data into a format suitable for a custom bracket component.
 */
import type { Match as DBMatch, Player } from './types';

export interface BracketRound {
    name: string;
    matches: DBMatch[];
}

export interface Group {
  name: string;
  matches: DBMatch[];
  standings: Standing[];
}

// New type for a single row in the standings table
export interface Standing {
    id: string; // A unique ID for the team, e.g., sorted player IDs joined by a hyphen.
    name: string; // The display name for the team.
    players: Player[];
    played: number;
    wins: number;
    losses: number;
    draws: number;
    points: number;
}


/**
 * Groups matches by their round name for Knockout tournaments.
 * @param dbMatches - An array of match objects from Firestore.
 * @returns An array of BracketRound objects.
 */
export const groupMatchesByRound = (dbMatches: DBMatch[]): BracketRound[] => {
  if (!dbMatches || dbMatches.length === 0) {
    return [];
  }

  const grouped: { [key: string]: DBMatch[] } = {};

  dbMatches.forEach((match) => {
    // Extract the round name from the matchName, e.g., "Round 1" from "Round 1 - Match 3"
    const roundName = match.matchName.split(' - ')[0] || 'Uncategorized';
    if (!grouped[roundName]) {
      grouped[roundName] = [];
    }
    grouped[roundName].push(match);
  });
  
  // Predefined sort order for tournament rounds
  const roundOrder = [
    'Quarter-Finals',
    'Semi-Finals',
    'Final'
  ];

  const getRoundOrder = (name: string): number => {
      const lowerCaseName = name.toLowerCase();
      // Handle "Round X"
      if(lowerCaseName.startsWith('round')){
        const num = parseInt(lowerCaseName.replace(/[^0-9]/g, ''), 10);
        return isNaN(num) ? 999 : num;
      }
      
      const indexInOrder = roundOrder.findIndex(r => lowerCaseName.startsWith(r.toLowerCase().split('-')[0]));
      // Start special rounds after a high number to ensure they come after numbered rounds
      return indexInOrder !== -1 ? 100 + indexInOrder : 999;
  };

  const roundKeys = Object.keys(grouped);

  roundKeys.sort((a, b) => {
    return getRoundOrder(a) - getRoundOrder(b);
  });

  return roundKeys.map(roundKey => {
    const roundMatches = grouped[roundKey];
    
    // Sort matches within the round by match number
    roundMatches.sort((a, b) => {
      const matchNumA = parseInt(a.matchName.split(' - Match ')[1] || '0');
      const matchNumB = parseInt(b.matchName.split(' - Match ')[1] || '0');
      return matchNumA - matchNumB;
    });

    return {
      name: roundKey,
      matches: roundMatches,
    };
  });
};

/**
 * Groups matches by their group name for Group Stage tournaments and calculates standings.
 * @param dbMatches - An array of match objects from Firestore.
 * @returns An array of Group objects with standings.
 */
export const groupMatchesByGroup = (dbMatches: DBMatch[]): Group[] => {
    if (!dbMatches || dbMatches.length === 0) {
        return [];
    }

    const grouped: { [key: string]: { matches: DBMatch[], teams: Map<string, Player[]> } } = {};

    // First, group matches and collect all unique teams
    dbMatches.forEach(match => {
        const groupName = match.groupName;
        if (!groupName) return;

        if (!grouped[groupName]) {
            grouped[groupName] = { matches: [], teams: new Map() };
        }
        grouped[groupName].matches.push(match);
        
        // Add teams to the map to keep track of all participants in the group
        const team1Id = match.player1.map(p => p.id).sort().join('-');
        if (!grouped[groupName].teams.has(team1Id) && match.player1.length > 0) {
            grouped[groupName].teams.set(team1Id, match.player1);
        }
        const team2Id = match.player2.map(p => p.id).sort().join('-');
        if (!grouped[groupName].teams.has(team2Id) && match.player2.length > 0) {
            grouped[groupName].teams.set(team2Id, match.player2);
        }
    });

    return Object.keys(grouped).sort().map(groupName => {
        const { matches, teams } = grouped[groupName];
        
        // Calculate standings
        const standingsMap = new Map<string, { team: Player[], played: number, wins: number, losses: number, draws: number, points: number }>();
        
        // Initialize all teams
        teams.forEach((team, teamId) => {
            standingsMap.set(teamId, { team, played: 0, wins: 0, losses: 0, draws: 0, points: 0 });
        });
        
        matches.forEach(match => {
            if (match.status !== 'finished') return;

            const team1Id = match.player1.map(p => p.id).sort().join('-');
            const team2Id = match.player2.map(p => p.id).sort().join('-');
            
            const team1Stats = standingsMap.get(team1Id);
            const team2Stats = standingsMap.get(team2Id);
            
            if (!team1Stats || !team2Stats) return;

            team1Stats.played++;
            team2Stats.played++;
            
            const p1Won = match.player1.some(p => p.id === match.winnerId);
            const p2Won = match.player2.some(p => p.id === match.winnerId);

            if (p1Won) {
                team1Stats.wins++;
                team1Stats.points += 3;
                team2Stats.losses++;
            } else if (p2Won) {
                team2Stats.wins++;
                team2Stats.points += 3;
                team1Stats.losses++;
            } else { // Draw or no winner set
                team1Stats.draws++;
                team2Stats.draws++;
                team1Stats.points++;
                team2Stats.points++;
            }
        });

        // Convert map to array and sort
        const standings: Standing[] = Array.from(standingsMap.values()).map(s => {
            const teamId = s.team.map(p => p.id).sort().join('-');
            const mainPlayer = s.team[0];
            let teamName = mainPlayer.name;
            if (s.team.length > 1) {
                teamName = `${mainPlayer.name} & ${s.team.length - 1} other${s.team.length > 2 ? 's' : ''}`;
            }

            return {
                id: teamId,
                name: teamName,
                players: s.team,
                played: s.played,
                wins: s.wins,
                losses: s.losses,
                draws: s.draws,
                points: s.points,
            }
        }).sort((a, b) => b.points - a.points || (b.wins - a.wins));


        return {
            name: groupName,
            matches,
            standings
        };
    });
};
